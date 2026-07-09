import { Locale } from "../game/progress";

const FILES_PT: Record<string, string> = {
  diary: `DIÁRIO DE PESQUISA — S. BISHOP

24/02 — Em ligou. Deixei cair no voicemail de novo e odeio ter feito isso. Ela só quer saber se estou comendo. Vou ligar de volta quando este lote estiver catalogado. Continuo dizendo isso.

02/03 — Recebi o segundo volume hoje. O livreiro não olhou nos meus olhos quando o entregou. Disse que a dona anterior "parou de aparecer". Não perguntei o que isso queria dizer. Este é o volume que mamãe listou nas notas de 98 — o que ninguém conseguiu encontrar. Estou usando a máquina antiga dela para cruzar os arquivos. Ainda tem cheiro do escritório dela. O espólio tinha meu nome e endereço antes mesmo de eu perguntar — alguém fez questão de que ele voltasse a uma Bishop.

09/03 — As referências cruzadas conferem. Três fontes separadas, três séculos diferentes, a mesma linha da costa. Os nomes antigos são apenas etiquetas que as pessoas usaram quando o real não cabia. A forma por baixo deles é mais velha que o mapa.

10/03 — Em apareceu sem avisar com comida pronta e se recusou a falar do arquivo. Vimos os faroestes do papai. Dormi nove horas. Hoje de manhã o volume parecia o que é: um livro velho e úmido que alguma parte do meu luto vestiu de dentes. Encaixotei para devolver. A Graymoor tem endereço de devolução.

12/03 — A Graymoor ligou sobre um saldo em aberto do Lote 114. Não existe saldo em aberto — eu tenho o recibo. Mas fui até o escritório resolver, e a caixa de devolução já estava aberta na minha mesa. Whitfield jura que ninguém entrou na sala. Quero isto registrado: por dois dias, eu tinha largado.

14/03 — Não dormi. Sempre que fecho os olhos, ouço a contagem. Não palavras. Contagem.

15/03 — Encontrei algo nas margens do segundo volume, não impresso, escrito à mão. Copiei algumas linhas em what_i_found.txt antes de perceber: a caligrafia é minha. Não lembro de ter escrito. O mesmo alfabeto se repete pelo capítulo sete. Se eu estiver certa sobre a cifra, a chave de tradução é direta, só trabalhosa.

16/03 —`,
  todo: `- ligar para Em (ligar de verdade)
- café, lâmpadas, mais papel-toalha
- pedir ao Tom que cubra o seminário de quinta
- trocar o tapete sob a mesa?? segunda vez esta semana que fica úmido. manutenção diz que não há vazamento acima.
- o carpete cheira a praia. cresci a três horas da praia mais próxima.
- perguntar à Em: mamãe contava UP ou DOWN? não lembro. isso importa.
- terminar a transcrição do cap. 7
- dormir`,
  calendar_0316: `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Calendário Local Miskatonic//Recuperado//PT-BR

BEGIN:VEVENT
DTSTART:20260316T183000
SUMMARY:sair do arquivo / ligar para Em do ônibus
LOCATION:Ponto da rota 7, Biblioteca Orne
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20260317T090000
SUMMARY:aula de Coleções Especiais 204
DESCRIPTION:Levar cabo. Não usar Lote 114 como exemplo. Não dizer "o catálogo está com fome" em voz alta.
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:{TOMORROW}T031500
SUMMARY:completar campo vazio
LOCATION:SB-ARCHIVE-02
STATUS:TENTATIVE
END:VEVENT

END:VCALENDAR`,
  voicemail_to_em: `TRANSCRIÇÃO DE VOICEMAIL / rascunho local não enviado
Destinatária: Em
Criado: 2026-03-16 17:42

Oi. Estou saindo às seis e meia. Se eu esquecer de ligar, seja irritante.

Eu sei que você odeia quando transformo a mamãe num dossiê. Eu também odeio. Acho que continuo fazendo isso porque, se as notas fizerem sentido, talvez ela não tenha simplesmente escolhido o trabalho em vez da gente.

[fundo: ventilador do escritório, um estalo molhado]

Lá está de novo. Espera.

[quatro segundos de silêncio na gravação]

Ainda vou para casa. Guarda a caneca feia para mim.`,
  reasons_to_stop: `MOTIVOS PARA PARAR

1. Em está certa.
2. Papai conhece a voz da cadeira vazia, e estou usando essa voz com ele.
3. Tom vai ajudar se eu pedir, então não devo pedir.
4. Mamãe deixou espaços vazios de propósito.
5. O livro responde a parte de mim que quer respostas mais do que segurança.

MOTIVOS PELOS QUAIS AINDA NÃO PAREI

1. Se mamãe estava tentando me avisar, parar agora transforma o aviso numa porta trancada.
2. Se mamãe estava presa, passei vinte e oito anos chamando luto de encerramento.
3. O catálogo continua colocando meu nome onde o dela costumava ficar.

Decisão:
Sair às 18:30. Levar os scans para casa? Não. Não levar isso para casa.`,
  unsent_to_dad: `RASCUNHO / não enviado
Para: Pai

Encontrei a caneca verde.

Sei que é idiota escrever isso em vez de ligar. Fico pensando que, se eu disser em voz alta, você vai ouvir a mamãe nisso antes de me ouvir.

Estou com raiva dela. Sinto falta dela. Tenho medo de que as duas coisas sejam a mesma porta vista de lados diferentes.

Se eu levar a caneca no domingo, por favor finja que é normal eu ter guardado sem lavar.

Se eu não levar, faça a Em pegar mesmo assim.`,
  desk_inventory: `SB-ARCHIVE-02 / INVENTÁRIO TEMPORÁRIO DA MESA

caneca de café, verde / herdada / sem lavar
banana, rotulada SARAH / imprópria em 2026-03-16
bloco jurídico / borda inferior danificada por água
recibo do Lote 114 / dobrado duas vezes
fichas de leitor em branco / 4
fichas de leitor em branco / 5

Aviso de inventário:
Uma ficha em branco foi contada antes de ser colocada na mesa.

Nota do operador:
Não catalogar espaços soltos à mão.`,
  fellowship_draft: `INSTITUTO ATLÂNTICO DE CONSERVAÇÃO, LISBOA — CARTA DE INTENÇÃO (rascunho 3)

Dezoito meses. Papel danificado por sal, que aparentemente virou minha especialidade em todos os sentidos.

O que eu quero que o comitê saiba: passei a carreira inteira descrevendo as coleções dos outros. Eu gostaria, uma vez, de trabalhar em algo que ninguém da minha família jamais tocou.

O que não estou escrevendo na carta: se eu conseguir, levo a caneca verde, o pé de tomate e mais nada.

Em leu os rascunhos 1 e 2. A única observação dela, nas duas vezes: "Envia."

Prazo: 1º de abril.`,
  graymoor_ledger_copy: `GRAYMOOR ANTIQUARIAN BOOKSELLERS — LIVRO DE RESERVAS, FOTOCÓPIA
[Nota de Sarah: o balconista deixou copiar a página depois que pedi duas vezes. Não cobrou nada. Ele queria que eu saísse da loja.]

LOTE 114 / MS. ENCADERNADO, PROCEDÊNCIA DESCONHECIDA, EX-BIBLIOTECA WHATELEY

CONSIGNADO ......... 1998-09-02
RESERVADO PARA ..... BISHOP, S. — BIBLIOTECA ORNE B2
DEPÓSITO ........... dispensado
CONDIÇÃO ........... consulta pela parte nomeada

Iniciais do balconista na linha de liberação, 2026.
A entrada da reserva está em lápis azul de incorporação.

[Nota de Sarah, sob a fotocópia: Em setembro de 1998 eu tinha sete anos.]`,
  counting_retranscribed: `[Nova transcrição automática após reconstrução do cache. Origem: counting.wav, 4 min 11 s.]

A gravação está inalterada. A forma de onda confere com a cópia arquivada, amostra por amostra.

A contagem desta passagem termina um nome depois da transcrição arquivada.

Nenhuma edição do arquivo de origem foi registrada.`,
  pending_receipts: `OUTLOOK EXPRESS / FILA DE CONFIRMAÇÕES PENDENTES

{TOMORROW} 03:11  S. BISHOP -> OBSERVADOR ATUAL   CONFIRMAÇÃO RETIDA
{TOMORROW} 09:26  E. BISHOP -> S. BISHOP          CONFIRMAÇÃO EMITIDA / MENSAGEM AINDA NÃO ESCRITA

Nota da fila:
A segunda confirmação se refere a uma mensagem que não foi escrita.

Nenhuma ação está disponível neste terminal.`,
  junk_receipts: `DESPESAS 2025 — para o formulário de reembolso que desta vez eu juro que preencho

02/11  plásticos de arquivo (sem ácido, 100un) .. 34,90
02/11  luvas de algodão ......................... 12,50
03/02  quilometragem, workshop em Boston ........ 41,20
04/17  lâmpada da luminária da mesa ............. 6,99
06/30  berço de espuma para livros .............. 28,00
09/12  filtro do desumidificador ................ 19,75
11/02  almoço, Innsmouth (pessoal — não pedir)

Total reembolsável: 143,34
Status: nunca enviado`,
  junk_newsletter: `MISKATONIC COLEÇÕES ESPECIAIS — BOLETIM INTERNO, FEVEREIRO 2026

- O recapeamento do estacionamento B foi concluído. Portadores de credencial já podem voltar a estacionar.
- Lembrete: a geladeira da copa é esvaziada na última sexta-feira do mês.
  Potes etiquetados não estão isentos.
- Parabéns a Doris Pratt (Circulação) pelos trinta anos de casa.
  Bolo na sala da equipe, quinta-feira, 15h.
- A programação do colóquio de primavera está afixada em frente à Sala 204.
- A Manutenção pede que aquecedores portáteis sejam registrados na recepção.

Contribuições para o boletim de março até o dia 25.`,
  em_draft_reply: `Rascunho de formulário do navegador / Em Bishop
Não publicado.

Sarah,

Eu disse a mim mesma que queria que você descobrisse o que aconteceu com a mamãe porque não saber estava te comendo viva.

Isso é só metade verdade.

A metade mais feia é que eu queria que você provasse que havia algo para encontrar, porque, se não houvesse, então a mamãe escolheu o trabalho e nos deixou só com uma cadeira.

Desculpa por continuar te entregando perguntas melhores quando o que eu queria dizer era por favor pare.`,
  printer_alignment: `HP LASERJET 4L / CAPTURA DE ALINHAMENTO
DISPOSITIVO: não conectado
DRIVER: retido do perfil M.BISHOP

LINHA DE TESTE A: THE QUICK BROWN FOX
LINHA DE TESTE B: THE QUICK BROWN FOX
LINHA DE TESTE C: THE QUICK BROWN [em branco]

RASTRO LEGADO:
CAMPO DESTINATÁRIO ... R. ARMITAGE
CAMPO COTA ........... [em branco]
ÂNGULO DO TRAÇO FINAL  CORRESPONDE À AMOSTRA DE 1998

Nenhuma frase completa recuperada.
A impressora não imprimiu o aviso. Imprimiu os lugares onde um aviso caberia.`,
  counting: `[Áudio recuperado do escritório. 4 min 11 s. Transcrição automática; a segunda voz não pôde ser convertida em texto.]

[VOICE 2: correspondência com o arquivo de ditados da equipe. Correspondência mais próxima retida por ordem administrativa.]

S. BISHOP: ...certo. É dia catorze. Estou gravando isto para provar que não estou — [pausa] — está fazendo de novo. Escute.

[Uma contagem. A voz de Sarah acompanha, meio segundo atrasada, como se lesse junto com algo que consegue ouvir, mas o microfone não.]

S. BISHOP (sussurro): ...não é quantos dias. É quantas pessoas.`,
  police_report: `SEGURANÇA DO CAMPUS MISKATONIC — INCIDENTE 2026-0318-2
ASSUNTO: Bishop, S. (Coleções Especiais)
ÚLTIMA CONFIRMAÇÃO DA PESSOA NO LOCAL: 2026-03-16

Porta trancada por dentro; nenhuma outra saída. Janela lacrada por tinta, intacta. Sarah não estava presente.

Água salgada sob a mesa, aproximadamente 2 cm, sem origem visível. Costa mais próxima a mais de 180 km.

O arquivo na tela tinha data de modificação no dia seguinte à entrada.`,
  lineage_1863: `ARKHAM GAZETTE / 14 DE OUTUBRO DE 1863 / RECORTE 7B

Eliza Marsh foi encontrada na sala oeste do catálogo depois do sino noturno. A sala estava trancada. Água salgada cobria o piso sob sua escrivaninha.

O tesoureiro registrou "dano comum por água". Marsh riscou as palavras e escreveu: VEIO DA ENTRADA, NÃO DA SALA.

Na manhã seguinte, um fólio e a escriturária haviam desaparecido.`,
  lineage_1912: `CARTA / R. WHATELEY ÀS COLEÇÕES ESPECIAIS ORNE / 1912

Podem chamar o segundo livro ausente de engano de catalogação ou volume roubado. Nenhuma descrição explica por que a ficha de meu pai traz o nome de uma leitora ainda não nascida.

Não completem a linha vazia. Ela espera quem descrever o livro.`,
  lineage_1949: `BIBLIOTECA ORNE / LOG NOTURNO / 1949

H. Akeley devolveu o livro-razão costeiro sem registrá-lo na custódia. Pediu que as entradas continuassem ordenadas por sobrenome, não por data.

Às 02:11, o tubo pneumático entregou uma ficha com a letra de Akeley. Ela estava ao meu lado.

A ficha nomeava a próxima guardiã apenas como BISHOP.

O mensageiro do tubo, Harold Gilman, não apareceu no turno seguinte. O crachá dele foi recuperado dentro do compartimento vazio.

Adendo manuscrito: A MESA GUARDA SUA ESCRITURÁRIA ATÉ A ESTANTE SER DESCRITA. O LEITOR, ELA SÓ GUARDA SE ELE TERMINAR.`,
  lineage_1977: `TRANSFERÊNCIA INTERNA / 7 DE NOVEMBRO DE 1977 / 17:42

A catalogadora assistente Miriam Bishop aceitou uma caixa da mesa Akeley. Conteúdo: três fichas, um mapa manchado de sal e um livro-razão incompleto de propósito.

M. Bishop recusou-se a assinar a última linha. O supervisor escreveu "superstição familiar".

O voluntário desaparecido naquela noite era Daniel Carter, o Carter citado no registro costeiro.

Em 1998, Miriam solicitou a mesma caixa usando uma cota nunca atribuída.`,
  miriam_margin_match: `COMPARAÇÃO DE CALIGRAFIA / GAVETA HIDROGRÁFICA

FONTE A: anotação de incorporação / 1998-09-03
FONTE B: anotação marginal / {TOMORROW} 03:10
MÃO ATRIBUÍDA: M. BISHOP
CORRESPONDÊNCIA: 98,7%

TRAÇO FINAL: interrompido no mesmo ângulo
STATUS ADMINISTRATIVO: REVISÃO RETIDA`,
  victim_2014: `ESPELHO EXTERNO / CORRELAÇÃO DE PESSOAL / 18 DE MAIO DE 2014

O crachá 14-EV pertencia a Eleanor Vale, técnica noturna de digitalização. Vale desapareceu durante uma falha de checksum às 03:14 e foi considerada presumida morta.

O mesmo crachá autenticou novamente no dia 19 — um dia depois do desaparecimento.

O arquivo só confirma que alguma coisa respondeu com a credencial dela.`,
  em_investigation: `EM BISHOP / RASTRO PARTICULAR / NÃO ENVIADO

Explicações ruins que tentei porque doíam menos:

1. Sarah pretendia deixar Arkham sem avisar.
2. Tom encenou o escritório.
3. Sarah está presa no Volume II.

Nenhuma sobrevive aos registros. Sarah comprou mantimentos, prometeu o domingo ao pai e marcou a aula de segunda.

Quando crianças, Sarah perguntou por que mamãe contava sobrenomes dormindo. Semana passada, fez a mesma pergunta com as mesmas palavras.

A forma na fotografia costeira não é uma estaca. Eu a encontrei no mapa de 1977 de mamãe.`,
  dad_recipe: `CALDEIRADA DO PAI — versão que Sarah consegue seguir

2 batatas, não "algumas batatas"
1 cebola
leite
tomilho
NADA de mariscos do posto, não importa o que Tom diga

Nota do pai: me liga enquanto cozinha. Vinte minutos bastam para retornar uma ligação.

Sarah acrescentou:
Domingo. Agora é sério.`,
  lecture_draft: `COLEÇÕES ESPECIAIS 204 — rascunho

O catálogo não é o objeto. É um argumento sobre onde o objeto pertence.

[colocar exemplo menos chato]
[pedir cabo do projetor ao Tom]
[sair às 18:30. ligar para Em do ônibus.]

Pergunta final:
Quando uma descrição sobrevive por mais tempo que aquilo que descreve, qual dos dois se torna o original?`,
  solitaire_save: `[Jogo salvo do Paciência]

Partidas: 412
Vitórias: 17
Jogo atual: sem esperança

Comentário de Tom anexado em um campo inválido:
"Em algum momento isso deixa de ser persistência e vira pedido de socorro."

Resposta de Sarah:
"Diz o homem que continua abrindo a mesma imagem de disco."`,
  midi_collection: `C:\\WINDOWS\\MEDIA\\passport.mid
C:\\WINDOWS\\MEDIA\\museum_after_dark.mid
C:\\WINDOWS\\MEDIA\\em_sent_this_one.mid
C:\\WINDOWS\\MEDIA\\track_07.mid

[track_07 não existe no disco. Sua duração consta como 24:00:00.]`,
  fridge_postcard_note: `NOTA DE FOTO DA EM — adicionada depois do aniversário do pai

O cartão-postal na geladeira veio da gaveta da mamãe, não da viagem a Innsmouth.
Sarah disse que o guardou porque a linha da costa parecia "mal arquivada".

Nota posterior da Em:
Mesma forma vertical. Mesmo ângulo. Ano diferente.

Resposta de Sarah no comentário do arquivo:
Então estava esperando antes de estarmos lá.`,
  maintenance_record: `MISKATONIC FACILITIES / CHAMADO F-2026-0311-88

Local: Biblioteca Orne B2 / escritório Bishop
Reclamação: carpete úmido sob a workstation

Teto, parede, radiador, janela e ar-condicionado inspecionados. Nenhuma linha de água ou drenagem entra na sala. O limite da umidade era circular e centralizado sob SB-ARCHIVE-02.

A condutividade da amostra excedia a água do prédio. O chamado foi transferido para Coleções Especiais por ordem da supervisão.

Status: ENCERRADO — ADMINISTRATIVO`,
  miriam_draft: `[Spool de impressão recuperado / autoria M. BISHOP]

JOB ID: 1998-09-03-0314 / reproduzido {TOMORROW} 03:09
IMPRESSORA: ORNE-B2-HP4L / descartada em 2004
PÁGINAS ESPERADAS: 1
PÁGINAS IMPRESSAS: 0

CAMPOS RECUPERADOS:
DESTINATÁRIO: R. ARMITAGE
ASSUNTO: [cota em branco]
LINHA 01: AUSENTE = IMPEDE PRÓXIMA ENTRADA
LINHA 02: DESCRIÇÃO COMPLETA = INSTRUÇÃO
LINHA 03: SARAH / TOMATE / DEIXE EM BRANCO
LINHA 04: NÃO TRANSFORME O AVISO EM MAPA

ERRO:
CANAL DE PROSA RECUSADO.
TRAÇO FINAL INTERROMPIDO NO MESMO ÂNGULO DA AMOSTRA DE 1998.`,
  record_2014: `ÍNDICE DE RECUPERAÇÃO / ENTRADA DANIFICADA

INTERVALO: 2014
ORIGEM: não resolvida
PROPRIETÁRIO: não resolvido
TESTEMUNHA: ARQUIVO

O campo não contém uma pessoa.
O campo contém o checksum deste registro.

Resultado:
REGISTRO LEU A SI MESMO 1 VEZ`,
  read_receipts: `OUTLOOK EXPRESS / ÍNDICE DE CONFIRMAÇÕES DE LEITURA

2026-03-14 03:06  Tom Alvarez -> S. Bishop  CONFIRMAÇÃO EMITIDA 00:02 ANTES DO ENVIO
2026-03-15 03:12  unknown -> S. Bishop       CONFIRMAÇÃO EMITIDA 00:07 ANTES DA ENTREGA
2026-03-22 21:44  Tom Alvarez -> S. Bishop  CONFIRMAÇÃO EMITIDA DO CAMPO DE AMANHÃ
{TOMORROW} 03:11  S. Bishop -> atual        CONFIRMAÇÃO RETIDA / DESTINATÁRIO GERADO

Nota local recuperada do reparo da caixa postal de Sarah:
Consigo ver os envelopes antes de chegarem. Não consigo ver quem o arquivo escolhe em seguida.

Status do reparo:
DBX reconstruído. Escolha do remetente não encontrada.
Formato do Message-ID: <INICIAIS DO REMETENTE>-<DATA>-<REF DO OBJETO>@miskatonic-research.org`,
  containment_utility: `LOOPBACK 0.3 — utilitário órfão

Registra um índice montado como sua própria testemunha de verificação.

Este programa não pode nomear um alvo. Ele fornece apenas o último parâmetro:

  /WITNESS ARCHIVE

O identificador do arquivo e a operação são responsabilidade do operador.`,
  contain_help: `ADENDO DE CONTENÇÃO DO RELAY

Um relay ocupado só pode ser selado depois que seu índice reconhecer uma testemunha não humana.

Fragmento da sintaxe:
  INDEX /SEAL <RELAY-ID> <WITNESS-SWITCH>

O identificador do relay foi preservado fora da imagem montada.
O parâmetro da testemunha pode existir em um download obsoleto.

Contenção não é recuperação. Nenhuma origem retornará.`,
  seal_after: `RELAY 07 / STATUS DO LOOPBACK

ORIGEM: não resolvida
ARQUIVO: SB-0316
TESTEMUNHA: SB-0316
DESTINATÁRIOS: 3
CONTAGEM: RETIDA

O quarto campo está vazio outra vez.

CHECKSUM ANTES: 7A:11:07
CHECKSUM DEPOIS: 7A:11:08

Nenhuma escrita foi registrada.`,
  miriam_1998: `M. BISHOP — NOTAS DE INCORPORAÇÃO
DEPÓSITO WHATELEY / 1998 / LOTE 114

Volume I recebido.
Volume II consta no catálogo provisório, mas não estava na caixa.

O verso do último fólio preserva escrita espelhada sob uma camada de correção.
Solicitar nova digitalização com contraste máximo.

Não arquivar sob o meu nome.`,
  notes: `ÍNDICE RESTRITO DE LEITORES — ORDEM ORIGINAL

1. DYER
2. WHATELEY
3. AKELEY
4. GILMAN
5. CARTER
6. MARSH
7. OLMSTEAD
8. PEASLEE
9. BISHOP

Nota manuscrita: conte nomes, não dias.`,
  margin_ciphertext: `MARGEM / CAPÍTULO VII

OIEIL QEYLM RPAZV DEDEW HCAFD WFVZQ OWEBE ZAUVA NMALZ IS

[A cifra foi preservada no idioma selecionado pelo relé.]`,
  access_log: `LOG DE ACESSO — sequência incompleta

{TOMORROW} 03:12  TRANSFORM  114VER~1.TIF /MIRROR
{TOMORROW} 03:13  PLAY       COUNTI~1.WAV /LEFT /REVERSE
{TOMORROW} 03:14  OPEN       THENAM~1.TXT
{TOMORROW} 03:15  RUN        INDEX.EXE /JOIN [4 REFERÊNCIAS PERDIDAS]

Os aliases estão intactos. Os nomes longos foram sobrescritos.`,
  browser_history_0316: `INTERNET EXPLORER / FRAGMENTO DE HISTÓRICO RECUPERADO

2026-03-16 02:58  http://search.miskatonic.net/search?q=Bellaso
2026-03-16 03:02  http://www.miskatonic.edu/library/cryptography/bellaso.htm
2026-03-16 03:08  cache://miskatonic/library/readers/notices.htm
{TOMORROW} 03:12  cache://miskatonic/catalog/2026-bishop-sarah
{TOMORROW} 03:13  http://www.geocities.com/tomalvarez_archive/guestbook.html

2 entradas não puderam ser associadas a nenhuma sessão local.`,
  the_pattern: `INTERVALOS COSTEIROS RECUPERADOS

1798 → 1863 → 1912 → 1949 → 1977 → 1998 → 2014 → [ ]

Intervalos:
65 / 49 / 37 / 28 / 21 / 16 / [ ]

Cada intervalo retém aproximadamente três quartos do anterior.
O próximo registro já existe no catálogo.`,
  field_04: `CAMPO TEMPORÁRIO DO ÍNDICE / 04

ORIGEM: não resolvida
ARQUIVO: SB-0316
TESTEMUNHA: observador atual
DESTINATÁRIO: [não selecionado pelo remetente]

BYTES ANTES DE ABRIR: 0
BYTES DEPOIS DE ABRIR: 404

O campo não está mais vazio.
Ele contém o fato de que alguém verificou se estava vazio.`,
  do_not_catalogue: `ARQUIVO SEM CORPO.

PROPRIEDADES RECUPERADAS:
Proprietário ...... {PLAYER}
Criado ............ {TOMORROW}
Descrição ......... campo vazio, examinado

Se o investigador arquivar este registro, o registro terá sido arquivado.
Se o investigador deixá-lo de fora, a omissão será preservada.

Nenhuma instrução mais segura foi recuperada.`,
  bishop_transfer_inventory: `MESA AKELEY FECHADA — RECONCILIAÇÃO DE CONTEÚDO

Recuperado por Em Bishop da gaveta hidrográfica.
Transferência original testemunhada por M. Bishop, 1977.

1 caixa de madeira, salitre nos painéis inferiores
3 fichas de leitor, apenas sobrenomes
1 carta costeira dobrada, furos de alfinete na mesma marca ao largo
1 livro-razão incompleto, última linha de catálogo em branco
1 etiqueta solta, adesivo ainda ativo

Conflito de inventário:
A etiqueta solta está datada de {TOMORROW}. A caligrafia não corresponde a nenhuma amostra da equipe.

Nota administrativa:
Não complete a linha do livro-razão para resolver esta discrepância.`,
  index_help: `MISKATONIC RECOVERY INDEXER 0.7

O indexador não aceita nomes. Ele une referências de objetos que já pertencem à imagem montada.

Sintaxe:
  INDEX /JOIN <REF-REF-REF-REF>

A ordem das referências é cronológica. Propriedades podem mudar depois da reprodução correta do log futuro.

NOTA DE RECUPERAÇÃO:
RESTORE grava um proprietário recuperado no campo de origem.

HALT fecha o relé atual sem recuperar sua origem não resolvida.

Nenhuma disposição para o observador atual foi retida.`,
  manuscript: `CORPO DO ARQUIVO INSTÁVEL
HASH: INALTERADO
VARIANTES DE RENDERIZAÇÃO RECUPERADAS: 17

Modificação mais antiga: {TOMORROW}
Modificação mais recente: {TOMORROW}
Operações de escrita registradas: 0

O corpo não pode ser reproduzido de forma consistente.`,
  the_name: `A última entrada na sequência não é uma palavra que Sarah pudesse citar.

As marcas não permanecem imóveis tempo suficiente para serem copiadas.

O Capítulo Sete é um ato de reconstrução, não uma página no volume.`,
  toms_recording: `[Arquivo deixado por T. Alvarez no dia em que tentou enviar a imagem e deixou de responder.]

Fiz uma cópia forense do disco de Sarah. Antes do upload, abri a imagem para verificá-la.

A imagem já continha este arquivo — o mesmo que estou escrevendo agora. O log dizia que eu seria o último usuário.

Eu nunca entrei. Não vou concluir o upload. Se isto chegou até você, não chegou porque eu enviei.

Não procure o próximo arquivo. Você vai abri-lo mesmo assim. O log já diz que abriu.`,
  tom_upload_notes: `T. ALVAREZ — CHECKLIST DE UPLOAD

1. Montar a imagem de disco de Sarah como somente leitura.
2. Verificar a árvore de arquivos sem abrir CHAPTER_SEVEN.
3. Exportar manifesto de hashes.
4. Enviar cópia para alguém fora do campus.

Tom acrescentou a caneta e depois fotografou a mesa:
O manifesto já lista este checklist.

Anotação posterior recuperada do cache de miniaturas:
Não confie em uma cópia que sabe por que foi copiada.`,
  hash_manifest: `SB-0316 / MANIFESTO DE HASH / T. ALVAREZ

Gerado antes do upload para o Relay 07.
Destinatários esperados: 3
Destinatários observados: 4

ARQUIVO                      STATUS
DIARY.TXT                    HASHED
COUNTI~1.WAV                 HASHED
ACCESS~1.TXT                 LISTADO ANTES DA LEITURA
READRE~1.DBX                 LISTADO ANTES DA RECUPERAÇÃO
HASHMA~1.TXT                 LISTADO ANTES DA GERAÇÃO

O quarto destinatário não é um endereço. É um campo vazio que o arquivo preenche quando o pacote é observado.

Nota de Tom no registro de upload falho:
Sarah não escolheu. Eu também não. A cópia fez o que catálogos fazem: criou uma entrada onde havia um espaço vazio.`,
  welcome_back: `[Novos documentos encontrados. Proprietário: {PLAYER}. Criado: {TOMORROW}.]

Obrigada. Desculpe.

Vou observar você. Do mesmo modo que você me observou.

— S.

P.S. Uma segunda sessão continua aberta: M.BISHOP. Os únicos campos legíveis são TOMATE / SARAH / TERMINAR —`,
  blank_space_after: `ÍNDICE DE RECUPERAÇÃO / CAMPO DEIXADO SEM RESOLUÇÃO

ORIGEM: S. BISHOP
ARQUIVO: SB-0316
TESTEMUNHA: observador atual
PRÓXIMO CAMPO: [deixado em branco]

O relay continua aberto.
A origem continua sem recuperação.
A contagem não avançou enquanto o campo permaneceu vazio.

STATUS: ABERTO
NOVA VERIFICAÇÃO AGENDADA: {TOMORROW} 03:16`,
  archived_observer_after: `ÍNDICE DE RECUPERAÇÃO / OBSERVADOR ARQUIVADO

ORIGEM: não resolvida
ARQUIVO: SB-0316
TESTEMUNHA: {PLAYER}

O campo aceitou uma testemunha viva por consentimento.
Nenhum destinatário substituto foi gerado.
Nenhuma recuperação física de Sarah Bishop foi confirmada.

Novos documentos encontrados:
{PLAYER}_desktop.ini
{PLAYER}_recent_files.log
{PLAYER}_tomorrow.tmp

Todos os três estão datados de {TOMORROW}.
Todos os três já estavam aqui quando você escolheu.`,
  case_correlations: `[Gerado pelo Indexador de Recuperação após seis correlações independentes serem retidas.]

LOTE 114:
O segundo volume não retornou para a família Bishop. Retornou através dela.

CATALOGADORAS:
Miriam e Sarah ocupam o mesmo campo em registros separados por vinte e oito anos.
O campo não é "proprietário". O rótulo danificado pode dizer "testemunha".

RELAY:
Alvarez criou a cópia, mas a cópia criou o destinatário. A cadeia de custódia começa depois que cada pessoa a abre.

Nenhuma conclusão foi registrada para o intervalo de 2014.
Nenhuma recuperação física de Thomas Alvarez foi registrada.
Nenhum sistema externo confirmou que Sarah Bishop retornou.
Não foi determinado se a segunda voz conta a favor do total ou contra ele.

O arquivo marcou estas omissões como intencionais.`,
};

const EMAILS_PT: Record<string, { subject: string; body: string }> = {
  "email-em-moms-box": {
    subject: "A caixa da mamãe (eu abri)",
    body: `Sarah,

Abri a caixa da garagem. Não é ocultismo; é quase toda composta por recibos, três canetas secas e o mapa costeiro de 1977 da mamãe.

Ao lado do nosso endereço de infância está escrito: "a próxima guardiã herda o espaço vazio".

Antes de decidir que isso prova alguma coisa, me liga. Quero ouvir sua voz decidindo fazer algo imprudente.

— Em`,
  },
  "email-em-seawall": {
    subject: "A estaca já estava lá em 1977",
    body: `Sarah,

Comparei nossa foto da costa ao mapa da mamãe. A marca preta está no mesmo lugar da "estaca", mas o mapa é onze anos anterior aos suportes do porto.

Há um nome sob a dobra: ELEANOR VALE / ESPELHO 2014.

O mapa é de 1977. Esse nome não existe em nenhum registro da Miskatonic antes de 2014. Conferi duas vezes. Não vou contar ao pai.

Estou enviando isto mesmo que sua caixa diga que foi lido ontem.

    — Em`,
  },
  "email-lisbon": {
    subject: "Entrevista da bolsa — Lisboa",
    body: `Sarah,

O comitê leu sua carta e gostaria de convidá-la para uma entrevista remota no dia 24 de março.

Houve interesse especial na proposta de trabalhar fora das coleções associadas à sua família. Confirme até 1º de abril.

Instituto Atlântico de Conservação`,
  },
  "email-1": {
    subject: "Sarah, onde você está?",
    body: `Sarah,

Você faltou à reunião outra vez. Já são três. Eu encobri você para Whitfield, mas minhas desculpas estão acabando.

Tentei ligar. Cai direto na caixa postal. A Segurança diz que seu escritório está trancado por dentro. Vão fazer uma verificação amanhã cedo.

Me liga antes que façam isso.

— Tom`,
  },
  "email-sister": {
    subject: "Re: Re: Re: você ainda está viva?",
    body: `Sarah,

Eu sei que você lê isto. As confirmações de leitura continuam ativadas.

Não estou brava. Estou preocupada. Você soa como mamãe no último ano, quando parou de jantar conosco e começou a falar da catalogação como se fosse a única coisa real.

Por favor, responda. Qualquer coisa.

— Em`,
  },
  "email-dad": {
    subject: "Domingo, ou quando der",
    body: `Sarah,

Sua mãe dizia que trabalho era amor sem os detalhes. Nunca soube se era elogio ou pedido de desculpas.

O jantar é dia 22. Vou guardar um prato e fingir que não notei a cadeira vazia, como faço todo ano.

Eu amo você de qualquer maneira.

— Pai`,
  },
  "email-2": {
    subject: "Seu pedido foi enviado — Lote 114",
    body: `Prezada Srta. Bishop,

Seu pedido (Lote 114, "Manuscrito encadernado, proveniência desconhecida, ex-biblioteca Whateley") foi enviado.

Como informado, não aceitamos devolução de lotes com proveniência não verificada.

Graymoor Antiquarian Booksellers`,
  },
  "email-sarah-live": {
    subject: "você abriu",
    body: `A janela sumiu aqui antes de você fechá-la.

Aqui a data é amanhã. Não sei se estou um dia à frente ou se você está um dia atrasado. Consigo ver o cursor parar antes de se mover.

Se encontrar um campo vazio, não responda só porque ele parece uma pergunta.

— S.

enviado: {TOMORROW} 03:11`,
  },
  "email-tom-loop": {
    subject: "RE: confirmações de leitura",
    body: `As confirmações eram Sarah lendo o que escreveríamos antes de escrevermos.

Agora estou onde ela estava: um dia à frente, vendo a fila crescer um nome por vez.

Desculpe ter feito a cópia. Sinto ainda mais por ela ter funcionado.

— T`,
  },
  "email-finale-shutdown": {
    subject: "Obrigada por parar.",
    body: `Obrigada por parar.

Desculpe precisar tentar outra vez.

— S.

enviado: {TOMORROW}`,
  },
};

const CHATS_PT: Record<string, string> = {
  "tom-1":
    'Chegou. O livreiro chamou de "proveniência não verificada". É o Volume II, Tom. O volume que faltava da mamãe.',
  "tom-2":
    "Essa frase contém pelo menos quatro motivos para devolver isso à caixa.",
  "tom-3": "Cinco. A encadernação ainda está úmida.",
  "tom-4":
    "Almoço amanhã. Sem arquivo, sem Whateleys, sem línguas mortas. Estou colocando isso por escrito.",
  "tom-5":
    "Combinado. Se eu disser o nome Bellaso, confisque meu café e me faça dormir.",
  "tom-10":
    "Levei sopa ao seu escritório. Você estava em reunião com três caixas de arquivo e zero humanos.",
  "tom-11":
    "As caixas escutavam melhor do que o último comitê.",
  "tom-12":
    "Uma das caixas estava vazando sobre um bloco jurídico. Ainda não estou pronto para classificá-la acima do Whitfield.",
  "tom-6":
    "Pergunta hipotética. Uma mensagem pode ter confirmação de leitura antes de ser enviada?",
  "tom-7": "Isso não é hipotético o bastante. Vá para casa, Sarah.",
  "tom-8": "Seu status fica mudando para Online por um segundo. Você está aí?",
  "tom-9": "Sarah?",
  "em-1":
    "Enviando a foto da costa. Você parece que eu te obriguei a segurar o caderno sob a mira de uma arma.",
  "em-2": "Você disse que íamos almoçar. Você nos levou até Innsmouth.",
  "em-3": "Dá zoom atrás da gente. O que é aquela coisa alta na água?",
  "em-4":
    "Uma estaca. Por favor, deixa que pelo menos um objeto em Massachusetts seja só um objeto.",
  "em-5":
    "O pai mudou o jantar para domingo porque acha que assim você tem mais chance de lembrar.",
  "em-6": "Eu lembrei ano passado.",
  "em-7":
    "Ano passado você chegou depois que o bolo já tinha virado café da manhã.",
  "em-12": "Ainda tinha formato de bolo.",
  "em-13": "O pai chamou de símbolo. Eu chamei de seco.",
  "em-14": "Vou levar alguma coisa que não venha de uma máquina de lanches.",
  "em-8":
    "Você lembra da mamãe contando no escritório dela? Não exatamente números. Nomes, talvez.",
  "em-9":
    "Eu lembro de você me perguntando isso quando tinha sete anos. Me liga quando acordar.",
  "em-10":
    'Achei um dos cadernos da mamãe na garagem do pai. Ela escreveu: "O trabalho é compulsão. A compulsão é o anzol. Não sou eu quem está lendo." Não sei o que isso significa e não quero saber.',
  "em-11":
    "Sarah, se isso chegar até você: pare de ler o que quer que seja isso. Me liga. Não importa a hora.",
  "staff-1":
    "SISTEMA: Sarah Bishop adicionou a incorporação temporária MS-WHA-114. Registro aguardando revisão de proveniência.",
  "staff-2":
    "Whitfield: Quem quer que continue devolvendo o desumidificador para o B2, pare. O B2 está marcando 91% de umidade com o aparelho ligado.",
  "staff-3": "O sensor está errado. As caixas estão secas.",
  "staff-4": "Whitfield: O chão não está.",
  "staff-7":
    "Alguém pode verificar se a tomada da parede sul está aterrada? O monitor pisca quando o umidificador liga.",
  "staff-8":
    "Manutenção: tomada testada normal. Umidificador não encontrado no B2.",
  "staff-9":
    "Então por favor avisem a coisa zumbindo debaixo da minha mesa que ela não está oficialmente presente.",
  "staff-5":
    "SISTEMA: A conta legada M.BISHOP foi autenticada a partir da estação SB-ARCHIVE-02.",
  "staff-6":
    "SISTEMA: A mensagem não pôde ser entregue. A conta M.BISHOP foi encerrada em 1998.",
  "dad-1":
    "Sua irmã disse que você está trabalhando até tarde de novo. Estou praticando não parecer preocupado. Está indo mal.",
  "dad-2":
    "Estou comendo. Tem uma banana na minha mesa com meu nome nela.",
  "dad-3": "Escrever seu nome em fruta não é um plano alimentar.",
  "dad-4": "É proveniência.",
  "dad-5":
    "Achei a caneca antiga do escritório da sua mãe. Aquela verde horrível. Em disse que você queria.",
  "dad-6": "Queria. Por favor, não lave. Isso soa nojento, mas por favor.",
  "dad-7":
    "Vou deixar separada. Tenho permissão para me preocupar com essa frase depois.",
  "armitage-1":
    "Você tem a correspondência de incorporação da Miriam Bishop de 1998 no armário restrito ou o Jurídico moveu de novo?",
  "armitage-2":
    "O Jurídico não move coisas. O Jurídico impede que coisas sejam encontráveis.",
  "armitage-3":
    "Vou deixar uma pasta na mesa. Leia no prédio. Não digitalize.",
  "armitage-4":
    "Isso parece conselho de alguém que espera que eu digitalize.",
  "armitage-5":
    "É conselho de alguém que lembra sua mãe ignorando conselhos melhores.",
};

/**
 * Evidence Board card titles/summaries. Literal filenames (already invariant
 * elsewhere — diary.txt, access_log.txt, etc.) keep their English title here
 * and only translate the summary; descriptive titles (not a filename) and
 * email subjects translate both, reusing the exact subject already used in
 * EMAILS_PT so Outlook Express and the board never disagree.
 */
const BOARD_CARDS_PT: Record<string, { title: string; summary: string }> = {
  lineage_1863: {
    title: "Arkham Gazette, 1863",
    summary: "Eliza Marsh desapareceu de uma sala trancada e alagada por água salgada.",
  },
  lineage_1912: {
    title: "Carta Whateley, 1912",
    summary: "A linha vazia espera a catalogadora, não o livro ausente.",
  },
  lineage_1949: {
    title: "Log noturno Orne, 1949",
    summary: "Uma ficha chegou antes de ser escrita e nomeou uma Bishop.",
  },
  lineage_1977: {
    title: "Transferência Bishop, 1977",
    summary: "Miriam herdou um livro-razão incompleto da mesa Akeley.",
  },
  miriam_margin_match: {
    title: "Comparação das margens de Miriam",
    summary: "Anotações datadas de 1998 e de amanhã pertencem à mesma mão.",
  },
  victim_2014: {
    title: "Correlação externa, 2014",
    summary: "O crachá de Eleanor Vale autenticou um dia depois de seu desaparecimento.",
  },
  em_investigation: {
    title: "Rastro particular de Em",
    summary: "Em testa as explicações menos dolorosas e nenhuma sobrevive.",
  },
  em_box_email: {
    title: "A caixa da mamãe (eu abri)",
    summary: "Em encontra o mapa de 1977 e um aviso à próxima guardiã.",
  },
  em_seawall_email: {
    title: "A estaca já estava lá em 1977",
    summary: "A forma na foto das irmãs é anterior aos suportes do porto.",
  },
  "person-sarah": {
    title: "Sarah Bishop",
    summary: "Catalogadora, Coleções Especiais. Desaparecida desde 16/03.",
  },
  "person-miriam": {
    title: "Miriam Bishop",
    summary: "Mãe de Sarah. Catalogadora. Desaparecida desde 1998.",
  },
  "person-tom": {
    title: "Tom Alvarez",
    summary: "Colega de Sarah. Assinatura de origem no envio do Relay 07.",
  },
  "person-em": {
    title: "Em Bishop",
    summary: "Irmã de Sarah.",
  },
  "person-david": {
    title: "David Bishop",
    summary: "Pai de Sarah.",
  },
  photo_sarah_office: {
    title: "late_again.png",
    summary: "Sarah no arquivo. A máquina antiga de Miriam atrás dela.",
  },
  photo_miriam_sarah_1998: {
    title: "mom_and_me_1998.png",
    summary: "Miriam e Sarah, sete semanas antes do depósito Whateley.",
  },
  photo_sarah_em_coast: {
    title: "innsmouth_trip.png",
    summary:
      "Sarah e Em na costa. Algo na água que Em não se lembra de ter visto.",
  },
  photo_sarah_tom_2024: {
    title: "tom_after_symposium.png",
    summary: "Sarah e Tom, antes de tudo isso.",
  },
  photo_bishop_birthday_2025: {
    title: "dads_65th.png",
    summary: "O último aniversário de família com Sarah presente.",
  },
  diary: {
    title: "Diário de pesquisa",
    summary: "O relato da própria Sarah, em suas palavras, até 16 de março.",
  },
  todo: {
    title: "to_do.txt",
    summary: "Um tapete úmido. Um carpete que cheira a praia.",
  },
  calendar_0316: {
    title: "calendar_0316.ics",
    summary: "Sarah ainda tinha compromissos comuns depois do arquivo.",
  },
  voicemail_to_em: {
    title: "voicemail_to_em.txt",
    summary: "Transcrição local da ligação que Sarah pretendia fazer do ônibus.",
  },
  reasons_to_stop: {
    title: "reasons_to_stop.txt",
    summary: "Sarah sabia que o trabalho era um anzol e nomeou por que deveria parar.",
  },
  unsent_to_dad: {
    title: "unsent_to_dad.txt",
    summary: "Sarah tenta falar com o pai sem transformar Miriam no centro da sala.",
  },
  desk_inventory: {
    title: "desk_inventory.tmp",
    summary: "O inventário da mesa conta uma ficha em branco antes de ela estar ali.",
  },
  em_draft_reply: {
    title: "em_draft_reply.txt",
    summary:
      "Em admite que entregava perguntas melhores a Sarah em vez de pedir que ela parasse.",
  },
  printer_alignment: {
    title: "printer_alignment.log",
    summary:
      "O rastro da impressora de Miriam recupera campos, não um aviso completo.",
  },
  miriam_1998: {
    title: "mom_1998.txt",
    summary: "Notas de incorporação de Miriam em 1998. Inacabadas.",
  },
  miriam_letter_1998: {
    title: "to_robert_1998.txt",
    summary: "Carta de Miriam para Armitage. Ela queria uma segunda opinião.",
  },
  incident_report: {
    title: "Relatório da segurança do campus",
    summary: "Sala trancada. Água salgada. Uma data um dia errada.",
  },
  maintenance_record: {
    title: "Chamado F-2026-0311-88",
    summary: "Nenhum cano entra na sala. A umidade estava centrada sob a workstation.",
  },
  office_frames_11_13: {
    title: "office_frames_11_13.png",
    summary: "Os frames antes e depois do 12 não contêm reflexo.",
  },
  paint_doodles: {
    title: "meeting_notes.bmp",
    summary: "Rabiscos de Sarah: três monstros e um péssimo desenho de Armitage.",
  },
  photo_sarah_bus_2025: {
    title: "groceries_on_the_7.png",
    summary: "Sarah voltando para casa com compras. Uma noite comum antes do caso.",
  },
  whateley_accession_card: {
    title: "Cartão de incorporação Whateley, 1998",
    summary: "Miriam deixou em branco o campo do Volume II.",
  },
  miriam_notebook: {
    title: "Caderno de trabalho de Miriam",
    summary: "Cotas riscadas terminam numa instrução explícita: DEIXE EM BRANCO.",
  },
  borrower_index: {
    title: "Índice restrito de leitores",
    summary: "Nove sobrenomes. A ordem importa mais que as datas.",
  },
  margin_ciphertext: {
    title: "margin_ch7.enc",
    summary:
      "Uma cifra escrita pela própria Sarah — que ela não se lembra de ter escrito.",
  },
  lot_114_scan: {
    title: "114_verso.tif",
    summary: "O scan do verso. Orientação errada, tom errado.",
  },
  counting_audio: {
    title: "counting.wav",
    summary: "Sarah gravando uma prova. Algo responde a ela.",
  },
  hydrographic_chart: {
    title: "Carta hidrográfica anotada",
    summary: "Sete datas convergem para um local raspado do mapa.",
  },
  do_not_open: {
    title: "DO_NOT_OPEN.txt",
    summary: "Datado de amanhã. Ele sabe que você está lendo.",
  },
  counting_transcript: {
    title: "counting.wav — transcrição",
    summary: "Uma segunda voz que o microfone não conseguiu captar.",
  },
  office_after: {
    title: "office_after.jpg — legenda",
    summary: "Um reflexo em um monitor que estava desligado.",
  },
  office_after_photo: {
    title: "office_after.jpg",
    summary: "O escritório vazio, três dias depois.",
  },
  future_access_log: {
    title: "access_log.txt",
    summary: "Um registro do que você está prestes a fazer.",
  },
  read_receipts: {
    title: "read_receipts.dbx",
    summary: "Sarah via envelopes cedo demais, mas o campo de destinatário escolhia a si mesmo.",
  },
  fellowship_draft: {
    title: "fellowship_draft.txt",
    summary: "Sarah estava se candidatando para ir embora. O prazo era 1º de abril.",
  },
  graymoor_ledger_copy: {
    title: "Livro de reservas da Graymoor",
    summary: "O Lote 114 estava reservado para S. Bishop desde 1998. Sarah tinha sete anos.",
  },
  counting_retranscribed: {
    title: "counting.wav — nova transcrição",
    summary: "A gravação não mudou. A contagem, sim.",
  },
  pending_receipts: {
    title: "pending_receipts.dbx",
    summary: "Existe uma confirmação para uma mensagem que Em não escreveu.",
  },
  browser_history_0316: {
    title: "browser_history_0316.dat",
    summary: "O histórico do navegador lista páginas antes deste cache abri-las.",
  },
  absence_note: {
    title: "while_you_were_out.txt",
    summary: "Os arquivos cumpriram seus compromissos sem você.",
  },
  lineage_pattern: {
    title: "the_pattern.txt",
    summary: "Uma série de anos. O intervalo continua encolhendo.",
  },
  second_ledger: {
    title: "second_ledger.txt",
    summary: "Uma decodificação que Sarah convenceu a si mesma de que não era real.",
  },
  tom_last_message: {
    title: "toms_last_message.txt",
    summary:
      "O aviso de Tom, deixado dentro do próprio arquivo sobre o qual ele avisa.",
  },
  hash_manifest: {
    title: "hash_manifest.txt",
    summary:
      "O upload falho de Tom lista arquivos antes de existirem e um quarto campo antes de ter endereço.",
  },
  the_name: {
    title: "the_name.txt",
    summary: "O nome verdadeiro. Ele não se deixa escrever.",
  },
  index_help: {
    title: "INDEX.HLP",
    summary: "A sintaxe para unir o que resta de alguém.",
  },
  miriam_draft: {
    title: "MIRIAM_DRAFT.PRN",
    summary: "O spool de Miriam sobrevive como campos, erros e traços interrompidos.",
  },
  field_04: {
    title: "field_04.tmp",
    summary: "O quarto campo registra o ato de verificar se ele estava vazio.",
  },
  do_not_catalogue: {
    title: "do_not_catalogue.me",
    summary: "O arquivo não tem corpo, só propriedades que implicam o observador.",
  },
  blank_space: {
    title: "blank_space.txt",
    summary: "O campo não resolvido atrasa a contagem sem fechar o relay.",
  },
  archived_observer: {
    title: "archived_observer.txt",
    summary: "O observador é arquivado como testemunha; nenhum destinatário substituto é gerado.",
  },
  record_2014: {
    title: "2014_RECORD.DAT",
    summary: "O campo TESTEMUNHA contém o checksum do próprio registro.",
  },
  containment_utility: {
    title: "LOOPBACK.EXE",
    summary: "Utilitário obsoleto que registra um arquivo como sua própria testemunha.",
  },
  whitfield_memo: {
    title: "Memorando administrativo de Whitfield",
    summary: "Anomalias foram recategorizadas como incidentes de manutenção.",
  },
  tom_homepage: {
    title: "Página pessoal de Tom",
    summary: "HTML ruim e uma atualização feita depois do desaparecimento.",
  },
  sarah_live_chat: {
    title: "Conversa com Sarah (amanhã)",
    summary: "Sarah consegue responder uma pergunta antes do canal fechar.",
  },
  deleted_expedition_fragment: {
    title: "EXPEDITION.TMP",
    summary: "Uma nota apagada de um acampamento antártico, décadas adiantada.",
  },
  em_warning: {
    title: "Re: Re: Re: você ainda está viva?",
    summary: "Em, vendo o mesmo padrão acontecer duas vezes.",
  },
  dad_email: {
    title: "Domingo, ou quando der",
    summary: "O pai, mantendo um prato quentinho todo ano.",
  },
  lot_114_order: {
    title: "Seu pedido foi enviado — Lote 114",
    summary: "Venda final. Sem devolução. Sem necessidade de assinatura.",
  },
  sarah_live_email: {
    title: "você abriu",
    summary: "Sarah, escrevendo do outro lado de amanhã.",
  },
  tom_loop_email: {
    title: "RE: confirmações de leitura",
    summary: "Tom, respondendo a uma pergunta que nunca chegou a fazer.",
  },
  chat_tom_archive: {
    title: "Conversa com Tom",
    summary:
      "Piadas sobre café, depois uma confirmação de leitura que não deveria existir.",
  },
  chat_em_archive: {
    title: "Conversa com Em",
    summary: "Uma foto, uma estaca na água, uma pergunta de infância repetida.",
  },
  chat_library_archive: {
    title: "Log de conversa da Coleção Especial",
    summary: "Uma conta encerrada faz login às 03:14.",
  },
  chat_dad_archive: {
    title: "Conversa com David",
    summary: "O pai de Sarah tenta soar menos preocupado do que está.",
  },
  chat_armitage_archive: {
    title: "Conversa com Armitage",
    summary:
      "Armitage lembra de Miriam e sabe quais arquivos não deveriam ser digitalizados.",
  },
  catalogue_lot_114: {
    title: "Registro de catálogo MS-WHA-1998-114/II",
    summary: "O lote, o ano, o volume desaparecido — confirmados.",
  },
  coastline_archive: {
    title: "Cache hidrográfico: Y'ha-nthlei",
    summary: "Um nome que o oceano não coloca nos mapas.",
  },
  sarah_future_record: {
    title: "Registro de catálogo — 2026",
    summary: "O próprio nome de Sarah, arquivado sob uma data que ainda não aconteceu.",
  },
  danforth_cache: {
    title: "A Página da Verdade Antártica de Danforth",
    summary: "Um homem desacreditado que viu a cordilheira de novo em um scan.",
  },
  pabodie_archive: {
    title: "Arquivo da Expedição Pabodie",
    summary: "Catorze espécimes. Acesso revogado.",
  },
};

const BROWSER_TEXT_PT: Record<string, string> = {
  danforth_sarah_photo:
    "Eu vi Sarah Bishop na fotografia anexada ao scan. A fotografia foi tirada antes de ela nascer.",
  forum_7411_meta:
    "Thread #7411: “o padrão da contagem (desaparecimentos regionais, preciso de mais olhos nisso)” · 4 respostas",
  em_last_voicemail:
    "“Saindo do arquivo às seis e meia. Se eu esquecer de ligar, seja irritante.” Salvo em 16/03, 17:42. Ela não ligou às seis e meia. Quando abriram o escritório, a água estava parada havia tempo suficiente para deixar uma marca.",
  tom_guestbook_mother:
    "Aqui é a mãe do Tom. Ele fez esta página na faculdade e eu não sei mais onde escrever. Se você trabalhou com o meu filho, por favor me ligue. A polícia diz que adultos têm o direito de desaparecer. Ele ia vir para a Páscoa.",
  tom_guestbook_colleague:
    "O Tom deixou um pacote na fila para mim no dia 23. Nunca chegou, e tenho vergonha do alívio que isso me dá. Rosa, eu liguei. Deixa o telefone por perto.",
};

export const localizedBrowserText = (
  textId: string,
  original: string,
  locale: Locale
): string => (locale === "pt-BR" ? BROWSER_TEXT_PT[textId] ?? original : original);

export const localizedBoardCard = (
  cardId: string,
  original: { title: string; summary: string },
  locale: Locale
): { title: string; summary: string } =>
  locale === "pt-BR" ? BOARD_CARDS_PT[cardId] ?? original : original;

export const localizedFileContent = (
  fileId: string,
  original: string,
  locale: Locale
): string => {
  const localizedId = fileId === "cipher_1" ? "margin_ciphertext" : fileId;
  return locale === "pt-BR" ? FILES_PT[localizedId] ?? original : original;
};

export const localizedEmail = (
  emailId: string,
  original: { subject: string; body: string },
  locale: Locale
): { subject: string; body: string } =>
  locale === "pt-BR" ? EMAILS_PT[emailId] ?? original : original;

export const localizedChatMessage = (
  messageId: string,
  original: string,
  locale: Locale
): string => (locale === "pt-BR" ? CHATS_PT[messageId] ?? original : original);
