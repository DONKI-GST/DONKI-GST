Gerou a estrutura inicial completa do repositório a partir do enunciado: setup.sql, fetch_nasa.py, workflow do Actions, painel e README.
Na modelagem, propôs a chave natural gst_id com UNIQUE, o que permite upsert sem duplicatas, além de RLS com leitura pública e GRANTs explícitos.
No script, incluiu deduplicação antes do upsert, gravação em lotes, registro em execucoes com os três status e sys.exit(1) em falhas.
No painel, montou um gráfico do Kp máximo por tempestade, filtros de período e intensidade, a data da última atualização e o escapeHtml().
Quando o workflow falhou, pesquisou na web e identificou que o DONKI tinha mudado de endereço, e corrigiu o script.

Onde a IA errou
Entregou o script com o endereço antigo (api.nasa.gov/DONKI/GST), que já estava desativado, sem testar contra a API real.
No primeiro diagnóstico do erro 503, atribuiu o problema a uma instabilidade passageira da NASA, quando a causa era a migração da API.
As fontes que confirmaram a migração eram de terceiros e não havia comunicado oficial, então a conclusão precisou ser validada por nós.

O que o grupo corrigiu
Reenviamos os arquivos ao GitHub mantendo a estrutura de pastas, porque no primeiro envio eles ficaram soltos na raiz.
Testamos a URL da API no navegador, o que mostrou a mensagem de erro do gateway e levou à descoberta da causa.
Substituímos fetch_nasa.py e README.md pelas versões atualizadas e validamos o novo endpoint, que devolveu o JSON esperado.
Configuramos os Secrets do GitHub e o projeto no Supabase, e rodamos o workflow de novo para obter a execução com dados reais.

O que aprendemos
Como o RLS e os GRANTs controlam quem lê e quem escreve no Supabase, e por que a service key fica só nos Secrets.
Como Actions, Supabase e Pages se encaixam em um pipeline, e como o log do workflow ajuda a achar a causa de uma falha.
Que as APIs mudam sem aviso e que o enunciado pode ficar desatualizado, então vale testar o endpoint antes de confiar nele.

Limitações e cuidados
Nunca expor a service key no código, em commits, prints ou mensagens. O painel usa só a publishable key.
Conferir os dados reais da API antes de confiar no código gerado pela IA, e testar cada etapa em vez de presumir que funciona.
Tratar o diagnóstico da IA como hipótese até validar com um teste, como fizemos no navegador.
Registrar o uso de IA com honestidade, incluindo os erros, porque isso faz parte da avaliação.
