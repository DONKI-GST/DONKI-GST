Usei o Claude em uma única conversa. A IA gerou o código-base do repositório. Eu configurei GitHub, Supabase e Secrets, enviei os arquivos, testei e colei os resultados reais para a IA corrigir.

Estrutura do repositório: enviei o PDF da atividade e pedi todos os arquivos e o que configurar no Supabase.

Acertos: UNIQUE (gst_id), deduplicação, RLS, GRANTs, log em execucoes e escapeHtml().

Erros: o script usava o endpoint antigo da NASA, que já estava desativado, e a IA não testou contra a API real. No primeiro upload, os arquivos ficaram soltos na raiz por erro meu.

Ajuste: reenviei mantendo as pastas.

Falha 503 no workflow: mandei o print do log.
A IA explicou que o pipeline falhou como projetado, mas errou ao apontar instabilidade passageira da NASA.
Ajuste: testei a URL no navegador.
Erro “upstream connect error”: a IA pesquisou e achou que o DONKI migrou em 30/09/2026 para ccmc.gsfc.nasa.gov, sem chave. Atualizou o script e o README.
Limite: as fontes eram de terceiros, por isso validei no navegador.
Ajuste: substituí os arquivos no GitHub.
Teste do novo endpoint: colei o JSON devolvido.
A IA conferiu que os campos batiam com o script e previu Kp 5,67 (G2) e Kp 7,0 (G3).
