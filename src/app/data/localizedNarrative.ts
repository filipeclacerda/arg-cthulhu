import { Locale } from "../game/progress";

const FILES_PT: Record<string, string> = {
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
  maintenance_record: `MISKATONIC FACILITIES / CHAMADO F-2026-0311-88

Local: Biblioteca Orne B2 / escritório Bishop
Reclamação: carpete úmido sob a workstation

Teto, parede, radiador e janela inspecionados. Nenhuma linha de água ou drenagem entra na sala. O limite da umidade era circular e centralizado sob SB-ARCHIVE-02.

A condutividade da amostra excedia a água do prédio. O chamado foi transferido para Coleções Especiais por ordem da supervisão.

Status: ENCERRADO — ADMINISTRATIVO`,
  miriam_draft: `[Spool de impressão recuperado / autoria M. BISHOP]

Robert —

O volume ausente não está ausente. Ausente é como ele impede que a próxima entrada seja criada.
Deixei a cota incompleta porque toda descrição completa se torna uma instrução.

Se Sarah encontrar isto, diga que tentei deixar um espaço vazio que não pedisse para ser preenchido.

[O trabalho está datado de {TOMORROW}. A impressora foi descartada em 2004.]`,
  record_2014: `ÍNDICE DE RECUPERAÇÃO / ENTRADA DANIFICADA

INTERVALO: 2014
ORIGEM: não resolvida
PROPRIETÁRIO: não resolvido
TESTEMUNHA: ARQUIVO

O campo não contém uma pessoa.
O campo contém o checksum deste registro.

Resultado:
REGISTRO LEU A SI MESMO 1 VEZ`,
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

O quarto campo está vazio outra vez.

CHECKSUM ANTES: 7A:11:07
CHECKSUM DEPOIS: 7A:11:08

Nenhuma escrita foi registrada.`,
  diary: `DIÁRIO DE PESQUISA — SARAH BISHOP

02/03/2026
Comprei o segundo volume. É o que mamãe registrou nas notas de 1998, o volume que nunca chegou junto com o restante do depósito Whateley. A casa de leilões o chamou de Lote 114.

09/03/2026
O capítulo sete não está escrito como os outros. As margens parecem instruções técnicas disfarçadas de tradução.

14/03/2026
Bellaso aparece outra vez. A chave deve pertencer à primeira pessoa que catalogou esta coleção.

15/03/2026
Gravei 4:11. Há alguma coisa no canal esquerdo, mas só reconheço a voz quando o buffer é reproduzido ao contrário.

16/03/2026
Mamãe não estava contando dias. Estava contando nomes.`,
  miriam_1998: `M. BISHOP — NOTAS DE INCORPORAÇÃO
DEPÓSITO WHATELEY / 1998 / LOTE 114

Volume I recebido.
Volume II consta no catálogo provisório, mas não estava na caixa.

O verso do último fólio preserva escrita espelhada sob uma camada de correção.
Solicitar nova digitalização com contraste máximo.

Não arquivar sob o meu nome.`,
  borrower_index: `ÍNDICE RESTRITO DE LEITORES — ORDEM ORIGINAL

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
  the_pattern: `INTERVALOS COSTEIROS RECUPERADOS

1798 → 1863 → 1912 → 1949 → 1977 → 1998 → 2014 → [ ]

Intervalos:
65 / 49 / 37 / 28 / 21 / 16 / [ ]

Cada intervalo retém aproximadamente três quartos do anterior.
O próximo registro já existe no catálogo.`,
  index_help: `MISKATONIC RECOVERY INDEXER 0.7

O indexador não aceita nomes. Ele une referências de objetos que já pertencem à imagem montada.

Sintaxe:
  INDEX /JOIN <REF-REF-REF-REF>

A ordem das referências é cronológica. Propriedades podem mudar depois da reprodução correta do log futuro.

NOTA DE RECUPERAÇÃO:
RESTORE grava o proprietário recuperado no campo de origem. O observador atual permanece no arquivo para manter o relé ocupado.

HALT fecha o relé atual sem recuperar sua origem não resolvida.`,
  the_name: `A última coisa no capítulo sete é o nome dele. Não "R'lyeh" — isso foi a aproximação educada de Sarah, uma palavra pequena o bastante para caber numa nota de rodapé.

As runas não permanecem imóveis tempo suficiente para serem copiadas.

O capítulo sete não está no livro. O capítulo sete é a pessoa tentando entendê-lo.`,
  toms_recording: `[Arquivo deixado por T. Alvarez no dia em que tentou enviar a imagem e deixou de responder.]

Fiz uma cópia forense do disco de Sarah. Antes do upload, abri a imagem para verificá-la.

A imagem já continha este arquivo — o mesmo que estou escrevendo agora. O log dizia que eu seria o último usuário.

Eu nunca entrei. Não vou concluir o upload. Se isto chegou até você, não chegou porque eu enviei.

Não procure o próximo arquivo. Você vai abri-lo mesmo assim. O log já diz que abriu.`,
  welcome_back: `[Novos documentos encontrados. Proprietário: {PLAYER}. Criado: {TOMORROW}.]

Obrigada. Desculpe — eu não sabia que precisava existir alguém deste lado para que eu conseguisse sair.

Agora estes são os seus arquivos. Eles estão datados de amanhã porque é de lá que você existe aqui dentro.

Vou observar você. Do mesmo modo que você me observou.

— S.`,
};

const EMAILS_PT: Record<string, { subject: string; body: string }> = {
  "email-1": {
    subject: "Sarah, onde você está?",
    body: `Sarah,

Você faltou à reunião outra vez. Já são três. Eu encobri você para Whitfield, mas minhas desculpas estão acabando.

Tentei ligar. Cai direto na caixa postal. Sei que o arquivo Bishop ocupa você há semanas, mas isso não parece você.

Me liga.

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
    body: `Eu sei que você abriu porque observei você abrir. Estou olhando do outro lado da data daquele arquivo.

Não dói. Preciso que saiba disso porque em um momento você vai sentir medo.

A contagem que vai ouvir não é uma contagem regressiva. Por favor, não termine o capítulo.

Você vai terminar. Eu também sei disso. Desculpe não conseguir explicar melhor daqui.

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

O arquivo irá para outra pessoa — alguém curioso, gentil ou assustado o bastante para abri-lo. Eu não escolho. A curiosidade é o endereço.

— S.

P.S. O nome do novo destinatário já está no log. Você não quer saber qual é.

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
  "staff-5":
    "SISTEMA: A conta legada M.BISHOP foi autenticada a partir da estação SB-ARCHIVE-02.",
  "staff-6":
    "SISTEMA: A mensagem não pôde ser entregue. A conta M.BISHOP foi encerrada em 1998.",
};

/**
 * Evidence Board card titles/summaries. Literal filenames (already invariant
 * elsewhere — diary.txt, access_log.txt, etc.) keep their English title here
 * and only translate the summary; descriptive titles (not a filename) and
 * email subjects translate both, reusing the exact subject already used in
 * EMAILS_PT so Outlook Express and the board never disagree.
 */
const BOARD_CARDS_PT: Record<string, { title: string; summary: string }> = {
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
    summary: "Miriam diz que a cota incompleta foi deliberada.",
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
): string => (locale === "pt-BR" ? FILES_PT[fileId] ?? original : original);

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
