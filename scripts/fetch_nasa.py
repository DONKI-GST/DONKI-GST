#!/usr/bin/env python3
"""Pipeline DONKI/GST: coleta -> normalização -> deduplicação -> upsert em lotes no Supabase."""
import os
import sys
import time
from datetime import datetime, timedelta, timezone

import requests

# Desde 30/09/2026 o DONKI é servido pelo CCMC, sem chave. O endereço antigo fica como reserva.
URLS = [
    "https://ccmc.gsfc.nasa.gov/DONKI-API/get/GST",
    "https://api.nasa.gov/DONKI/GST",
]
JANELA_DIAS = 30
TAMANHO_LOTE = 100


def config():
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    chave = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not chave:
        print("ERRO: defina SUPABASE_URL e SUPABASE_SERVICE_KEY (Secrets do GitHub).")
        sys.exit(1)
    return {
        "url": url,
        "headers": {
            "apikey": chave,
            "Authorization": f"Bearer {chave}",
            "Content-Type": "application/json",
        },
        "nasa_key": os.environ.get("NASA_API_KEY") or "DEMO_KEY",
        "dias": int(os.environ.get("DIAS") or 180),
    }


def consultar_janela(cfg, inicio, fim):
    """Consulta uma janela de datas, tentando o endereço novo e depois o antigo."""
    ultimo_erro = "sem resposta"
    for url in URLS:
        params = {"startDate": inicio.isoformat(), "endDate": fim.isoformat()}
        if "api.nasa.gov" in url:
            params["api_key"] = cfg["nasa_key"]
        for tentativa in range(1, 4):
            try:
                r = requests.get(url, params=params, timeout=60)
            except requests.RequestException as e:
                ultimo_erro = f"{url}: {e}"
            else:
                if r.status_code == 429 or r.status_code >= 500:
                    ultimo_erro = f"{url}: HTTP {r.status_code}"
                elif r.status_code >= 400:
                    ultimo_erro = f"{url}: HTTP {r.status_code}"
                    break
                elif not r.text.strip():
                    return []
                else:
                    try:
                        dados = r.json()
                    except ValueError:
                        ultimo_erro = f"{url}: resposta não é JSON (página de aviso?)"
                        break
                    if isinstance(dados, list):
                        return dados
                    ultimo_erro = f"{url}: formato inesperado de resposta"
                    break
            espera = 10 * tentativa
            print(f"{ultimo_erro}; nova tentativa em {espera}s ({tentativa}/3)")
            time.sleep(espera)
        print(f"Endereço descartado: {ultimo_erro}")
    raise RuntimeError(f"API indisponível: {ultimo_erro}")


def buscar_gst(cfg):
    fim = datetime.now(timezone.utc).date()
    inicio = fim - timedelta(days=cfg["dias"])
    eventos = []
    atual = inicio
    while atual <= fim:
        limite = min(atual + timedelta(days=JANELA_DIAS - 1), fim)
        eventos.extend(consultar_janela(cfg, atual, limite))
        atual = limite + timedelta(days=1)
    return eventos


def nivel_g(kp):
    """Escala NOAA: Kp 5 = G1 ... Kp 9 = G5; abaixo disso = 0."""
    if kp is None:
        return 0
    arredondado = round(float(kp))
    return min(arredondado - 4, 5) if arredondado >= 5 else 0


def normalizar(ev):
    gst_id = ev.get("gstID")
    if not gst_id or not ev.get("startTime"):
        return None
    medicoes = ev.get("allKpIndex") or []
    melhor = max(medicoes, key=lambda m: m.get("kpIndex") or 0, default=None)
    kp = melhor.get("kpIndex") if melhor else None
    return {
        "gst_id": gst_id,
        "start_time": ev.get("startTime"),
        "kp_max": kp,
        "kp_max_observado_em": melhor.get("observedTime") if melhor else None,
        "kp_max_fonte": melhor.get("source") if melhor else None,
        "nivel_g": nivel_g(kp),
        "qtd_medicoes": len(medicoes),
        "all_kp_index": medicoes,
        "linked_events": ev.get("linkedEvents") or [],
        "link": ev.get("link"),
        "submission_time": ev.get("submissionTime"),
        "version_id": ev.get("versionId"),
        "atualizado_em": datetime.now(timezone.utc).isoformat(),
    }


def deduplicar(registros):
    """Mantém um registro por gst_id (o de maior version_id) -> evita o erro PostgreSQL 21000."""
    unicos = {}
    for reg in registros:
        atual = unicos.get(reg["gst_id"])
        if atual is None or (reg["version_id"] or 0) >= (atual["version_id"] or 0):
            unicos[reg["gst_id"]] = reg
    return list(unicos.values())


def upsert_lote(cfg, lote):
    headers = {**cfg["headers"], "Prefer": "resolution=merge-duplicates,return=minimal"}
    r = requests.post(
        f"{cfg['url']}/rest/v1/gst_eventos?on_conflict=gst_id",
        headers=headers,
        json=lote,
        timeout=60,
    )
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase {r.status_code}: {r.text[:300]}")


def registrar_execucao(cfg, inicio, processados, lotes, erros, status, mensagem):
    corpo = {
        "iniciado_em": inicio.isoformat(),
        "finalizado_em": datetime.now(timezone.utc).isoformat(),
        "registros_processados": processados,
        "lotes": lotes,
        "erros": erros,
        "status": status,
        "mensagem": (mensagem or "")[:500],
    }
    headers = {**cfg["headers"], "Prefer": "return=minimal"}
    try:
        r = requests.post(f"{cfg['url']}/rest/v1/execucoes", headers=headers, json=corpo, timeout=30)
        if r.status_code >= 300:
            print(f"AVISO: não foi possível gravar em execucoes ({r.status_code}): {r.text[:200]}")
    except requests.RequestException as e:
        print(f"AVISO: falha ao gravar em execucoes: {e}")


def main():
    cfg = config()
    inicio = datetime.now(timezone.utc)
    processados = lotes_ok = erros = 0
    mensagem = ""

    try:
        brutos = buscar_gst(cfg)
        print(f"NASA devolveu {len(brutos)} eventos (últimos {cfg['dias']} dias)")
        normalizados = [n for n in (normalizar(e) for e in brutos) if n]
        registros = deduplicar(normalizados)
        print(f"{len(registros)} registros únicos após deduplicação")

        lotes_total = 0
        for i in range(0, len(registros), TAMANHO_LOTE):
            lote = registros[i:i + TAMANHO_LOTE]
            lotes_total += 1
            try:
                upsert_lote(cfg, lote)
                processados += len(lote)
                lotes_ok += 1
                print(f"Lote {lotes_total}: {len(lote)} registros gravados")
            except Exception as e:  # noqa: BLE001
                erros += 1
                mensagem = str(e)
                print(f"ERRO no lote {lotes_total}: {e}")

        if erros == 0:
            status = "concluido"
            mensagem = mensagem or f"{processados} registros gravados"
        elif lotes_ok > 0:
            status = "erro_parcial"
        else:
            status = "erro_critico"
    except Exception as e:  # noqa: BLE001
        status = "erro_critico"
        erros += 1
        mensagem = str(e)
        print(f"ERRO CRÍTICO: {e}")

    registrar_execucao(cfg, inicio, processados, lotes_ok, erros, status, mensagem)
    print(f"Status final: {status}")
    if status != "concluido":
        sys.exit(1)  # deixa o workflow vermelho e visível nos logs do Actions


if __name__ == "__main__":
    main()
