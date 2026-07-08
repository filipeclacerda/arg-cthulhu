# Walkthrough completo — O Arquivo de Amanhã

> **SPOILERS TOTAIS.** Este guia revela todas as respostas, a ordem exata dos enigmas,
> o significado dos acontecimentos e os três finais. Para uma primeira partida sem spoilers,
> feche este documento agora.

## Respostas rápidas

| Etapa | Resposta ou ação |
| --- | --- |
| Achado: último dia | `6:30 in the evening` + `go home to her family` |
| Achado: Volume II | `deliberately re-sent` + `Bishop` |
| Achado: sala trancada | `beneath the workstation` + `water pipe` |
| Achado histórico | `1977` + `Bishop` + `an intentionally incomplete ledger` |
| Achado: Sarah no amanhã | `tomorrow` + `one day ahead` |
| Achado: Relay 07 | `observer` + `archive field` |
| Achado: capítulo sete | `act of reconstruction` + `observer` |
| Casefile — cronologia | Miriam 1998 → lote enviado → áudio → Sarah desaparece → foto do escritório → Tom monta a imagem → log futuro |
| Casefile — refutações | Tom falsificou: `tom_last_message` + `future_access_log`; Sarah fugiu: `incident_report` + `chat_em_archive`; Innsmouth roubou: `lot_114_order` + `catalogue_lot_114` |
| Catálogo | Pesquisar `WHATELEY 1998 114 VOLUME II` |
| Palimpsesto | `Mirror` + `Invert` + contraste em 90 ou mais |
| Cifra | Vigenère, chave `MIRIAM` |
| Áudio | Canal `Left` + `Reverse buffer` + `Play` |
| Coordenadas | Formam `YHANTHLEI` |
| Linhagem | Próximo ano: `2026` |
| Log futuro | Espelhar imagem → tocar áudio Left/Reverse → abrir `the_name.txt` |
| Referências | `E7`, `A1`, `C4`, `B9` |
| Comando final | `INDEX /JOIN E7-A1-C4-B9` |
| Contenção secreta | `INDEX /SEAL RELAY-07 /WITNESS ARCHIVE` |

## 1. Entrando no computador

1. A primeira tela é o **Orne Library Dark Archive / Relay 07**. Ela está fora do computador
   de Sarah. Aguarde o relay identificar o pacote `SB-0316`.
2. Leia o envelope de upload de Tom e clique em **OPEN SEALED ATTACHMENT**.
3. Em **Observer designation**, escreva seu nome ou deixe em branco. O relay gera o
   destinatário somente agora; em branco, o jogo usará `NEXT USER`.
4. Use as credenciais recuperadas:
   - usuário: `sarah.bishop`
   - senha: `password`
5. Clique em **MOUNT READ-ONLY IMAGE** ou **CONTINUE MOUNTED CASE**.
6. A partir desse ponto você está dentro do Windows de Sarah. O relay não aparece na caixa
   postal nem em seus arquivos.
7. Abra **Outlook Express** e leia pelo menos:
   - `Your order has shipped — Lot 114`
   - `Sarah, where are you?`
   - `Re: Re: Re: are you even alive`
8. Abra **My Documents**, que leva diretamente à pasta de Sarah. O caminho longo equivalente
   é `My Computer → Local Disk (C:) → Users → Sarah Bishop`.

Os arquivos iniciais mais importantes são:

- `diary.txt`
- `mom_1998.txt`
- `borrower_index.txt`
- `incident_report.txt`

O relatório é o incidente `2026-0318-2`, aberto em 18/03. Ele registra Sarah como vista pela
última vez no prédio em 16/03; Tom avisa em 17/03 que a Segurança fará o welfare check na
manhã seguinte.

Conteúdo opcional recomendado: abra `My Pictures`. O Image Viewer permite navegar pelas cinco
fotografias e consultar **Properties** para ler datas, câmera, local e comentários pessoais.
Elas não são necessárias para resolver os puzzles.

Abra também o **MSN Messenger**. As três conversas arquivadas são opcionais, mas reforçam as
relações entre Sarah, Tom, Em e Miriam. O campo de mensagem está desativado de propósito.

As informações que precisam ser cruzadas são:

- o lote é o **114**;
- a procedência é **Whateley**;
- Miriam catalogou a coleção em **1998**;
- o objeto ausente era o **Volume II**.

## 1A. Casefile.exe — extraindo fatos e reconstruindo o caso

Abra um documento no Notepad, uma mensagem, um e-mail ou um metadado. Trechos com uma
marcação discreta podem ser clicados. Ao clicar, o jogo **extrai um fato** para:

- `Casefile.exe → Achados → Fact bank`;
- `Case Notes → Facts`.

No **Casefile.exe**, use a lente **Achados**. Clique numa lacuna, escolha ou arraste um
fato do tipo pedido, anexe registros que corroborem a frase e pressione **Test finding**.
Palavras corretas ficam douradas e continuam travadas mesmo se as demais estiverem erradas.

Resolva os três achados iniciais em qualquer ordem:

1. `On her last day, Sarah meant to leave the archive around`
   **6:30 in the evening** `and` **go home to her family**.
   - Extraia ambos de `lecture_draft.txt`.
   - Anexe `lecture_draft` e, por exemplo, o e-mail do pai ou a conversa com Em.
2. `Volume II resurfaced because it was` **deliberately re-sent**,
   `routed back through the` **Bishop** `line`.
   - Extraia o envio deliberado de `diary.txt` e `Bishop` de `borrower_index.txt`.
   - Anexe `mom_1998.txt` e o diário, pedido do Lote 114 ou cartão Whateley.
3. `In the sealed office the seawater surfaced` **beneath the workstation**,
   `and no` **water pipe** `could account for it`.
   - Extraia os dois fatos de `facilities_ticket_0311.txt`.
   - Anexe o relatório de incidente e o chamado de manutenção.

Duas frases completas fazem `RECOVERED` reaparecer. As três acordam a impressora virtual,
criam `MIRIAM_DRAFT.PRN` e abrem `RECOVERED/LINEAGE`.

Dentro de `LINEAGE`, leia os dossiês de 1863, 1912, 1949 e 1977, o registro de Eleanor
Vale em 2014, `miriam_margin_match.txt` e o rastro particular da Em. O laudo compara uma
anotação de 1998 a outra datada de amanhã e atribui ambas à mão de Miriam. O achado histórico
opcional é:

```text
1977 → Bishop → an intentionally incomplete ledger
```

Anexe o documento de 1977 e pelo menos dois outros dossiês históricos. Esse achado não
bloqueia a campanha, mas explica como o aviso chegou a Miriam e alimenta a descoberta do
final secreto.

### Respostas completas do Casefile.exe

O **Casefile.exe** concentra quatro lentes: **Achados**, **Correlações**, **Cronologia** e
**Refutar**. As respostas abaixo cobrem todos os gates e descobertas desse hub.

#### Achados — achados retidos

1. **Último dia de Sarah**
   - Frase: `On her last day, Sarah meant to leave the archive around`
     **6:30 in the evening** `and` **go home to her family**.
   - Fatos: `time-six-thirty` + `intent-go-home`.
   - Fonte dos fatos: `lecture_draft.txt`.
   - Anexos válidos: dois entre `lecture_draft`, `chat_em_archive`, `dad_email`, `todo`,
     `photo_bishop_birthday_2025`.
2. **Retorno do Volume II**
   - Frase: `Volume II resurfaced because it was` **deliberately re-sent**,
     `routed back through the` **Bishop** `line`.
   - Fatos: `cause-deliberately-sent` + `family-bishop`.
   - Fontes dos fatos: `diary.txt` e `borrower_index.txt`.
   - Anexos válidos: `miriam_1998` obrigatório, mais pelo menos um entre `lot_114_order`,
     `diary`, `miriam_letter_1998`, `catalogue_lot_114`, `whateley_accession_card`.
3. **Sala trancada**
   - Frase: `In the sealed office the seawater surfaced` **beneath the workstation**,
     `and no` **water pipe** `could account for it`.
   - Fatos: `place-under-workstation` + `object-pipe`.
   - Fonte dos fatos: `facilities_ticket_0311.txt`.
   - Anexos válidos: `incident_report` obrigatório, mais pelo menos um entre
     `office_after_photo`, `maintenance_record`, `office_frames_11_13`.
4. **Achado histórico opcional**
   - Frase: `In` **1977**, `the` **Bishop** `line inherited`
     **an intentionally incomplete ledger**.
   - Fatos: `year-1977` + `family-bishop` + `detail-incomplete-ledger`.
   - Fontes dos fatos: `lineage_1977` e `borrower_index`.
   - Anexos válidos: `lineage_1977` obrigatório, mais dois entre `lineage_1863`,
     `lineage_1912`, `lineage_1949`, `em_investigation`.
5. **Sarah no amanhã**
   - Frase: `Sarah is not gone: she is held in` **tomorrow**, `always`
     **one day ahead** `of whoever observes`.
   - Fatos: `status-tomorrow` + `time-one-day`.
   - Fonte dos fatos: e-mail `you opened it`.
   - Anexos válidos: `sarah_live_email` obrigatório, mais um entre `future_access_log`,
     `do_not_open`, `absence_note`.
6. **Relay 07**
   - Frase: `The Relay 07 stays open only while a living` **observer**
     `occupies the` **archive field**.
   - Fatos: `person-observer` + `object-archive-field`.
   - Fontes dos fatos: `toms_last_message.txt` e `2014_RECORD.DAT`.
   - Anexos válidos: `tom_last_message` obrigatório, mais um entre `sarah_live_email`,
     `future_access_log`, `index_help`.
7. **Capítulo sete**
   - Frase: `Chapter Seven is not in the book — it is the`
     **act of reconstruction** `carried out by the` **observer**.
   - Fatos: `cause-act-of-reconstruction` + `person-observer`.
   - Fontes dos fatos: `the_name.txt` e `toms_last_message.txt`.
   - Anexos válidos: `the_name` obrigatório, mais um entre `margin_ciphertext`,
     `counting_audio`, `lineage_pattern`, `future_access_log`.

#### Correlações — correlações retidas

Na lente **Correlações**, selecione as cartas listadas. Uma correlação correta vira fio
dourado e conta para o final secreto.

1. **The second volume returned through the Bishops**
   - Cartas: `miriam_1998` + `diary` + `lot_114_order`.
2. **Miriam and Sarah occupy the same catalogue field**
   - Cartas: `person-miriam` + `person-sarah` + `lineage_pattern`.
3. **The copy creates its recipient**
   - Cartas: `person-sarah` + `person-tom` + `future_access_log` ou `sarah_live_email`.
4. **Miskatonic archived anomalies as maintenance incidents**
   - Cartas: `incident_report` + `maintenance_record` + `whitfield_memo` ou
     `coastline_archive`.
5. **Miriam left the catalogue incomplete on purpose**
   - Cartas: `miriam_1998` + `miriam_letter_1998` + `catalogue_lot_114`,
     `margin_ciphertext` ou `miriam_notebook`.
6. **An archive can be registered as its own observer**
   - Cartas: `future_access_log` + `index_help` + `containment_utility` ou `record_2014`.

#### Refutar — hipóteses refutadas

Na lente **Refutar**, cada hipótese falsa exige dois registros independentes:

1. **Tom forged the forensic image**
   - Refute com `tom_last_message` + `future_access_log`.
2. **Sarah fled after exposing the university**
   - Refute com `incident_report` + `chat_em_archive`.
3. **The Innsmouth society stole Volume II**
   - Refute com `lot_114_order` + `catalogue_lot_114`.

#### Cronologia — cronologia do caso

Na lente **Cronologia**, ordene os eventos descobertos nesta sequência:

1. `1998-09-03` — Miriam deixa a nota de incorporação inacabada (`miriam_1998`).
2. `1998-09-14` — Miriam Bishop é declarada desaparecida (`miriam_letter_1998`).
3. `2026-02-28` — Graymoor envia o Lote 114 para Sarah (`lot_114_order`).
4. `2026-03-14` — Sarah grava a contagem (`counting_audio`).
5. `2026-03-16` — Sarah desaparece da sala trancada (`incident_report`).
6. `2026-03-19` — a Segurança fotografa o escritório vazio (`office_after_photo`).
7. `2026-03-23` — Tom monta a imagem forense (`tom_last_message`).
8. `{TOMORROW}` — a imagem registra as ações do observador (`future_access_log`).

## 2. O catálogo do Lote 114

1. Abra o **Internet Explorer** pelo desktop ou por
   `Start → Programs → Internet Explorer`.
2. Na barra **Address**, pesquise:

   ```text
   WHATELEY 1998 114 VOLUME II
   ```

   A ordem das palavras e a pontuação não importam. `II` também pode ser escrito como
   `VOLUME 2`.
3. O catálogo encontra:

   ```text
   MS-WHA-1998-114/II
   ```

   Esse código de acessão também aparece nas Properties do scan recuperado (`114_verso.tif`),
   confirmando que o registro do catálogo e o objeto físico são a mesma coisa.
4. A pasta `RECOVERED` aparece dentro da pasta de Sarah, e um aviso "New folder recovered"
   surge na barra de tarefas para sinalizar a mudança.

## 3. O palimpsesto

1. Entre em `RECOVERED`.
2. Abra `114_verso.tif`.
3. No **Image Viewer**:
   - ative **Mirror**;
   - ative **Invert**;
   - coloque **Contrast** em 90 ou mais.
4. A imagem revela:

   ```text
   BELLASO
   the key belongs to her first cataloguer
   ```

Isso inicia o primeiro estágio de corrupção e libera `margin_ch7.enc`.

### Se você não reconhecer Bellaso

No Internet Explorer, abra:

`Miskatonic University → Cryptography reference shelf: moving alphabets`

A página explica que Giovan Battista Bellaso está ligado à família de cifras hoje conhecida
como Vigenère. Essa é a solução offline; pesquisar Bellaso na web real é apenas um atalho.

## 4. A cifra da margem

1. Abra `margin_ch7.enc`.
2. Copie o texto:

   ```text
   XMWBC TMVEM LDQDV ZSQRW LZEXQ DVVCA GVKVA YQAEW TPMGJ
   ```

3. Abra `Start → Programs → Accessories → Cipher Lab`.
4. Configure:
   - **Method:** `Vigenere / moving alphabet`;
   - **Key:** `MIRIAM`
5. Clique em **Decode**.

O resultado é:

```text
LEFT CHANNEL / REVERSE / FOUR ELEVEN / COUNT NAMES, NOT DAYS
```

Miriam é a chave porque foi a primeira catalogadora da coleção.

## 5. A gravação de 4:11

1. Volte à pasta `RECOVERED`.
2. Abra `counting.wav`.
3. No **Media Player**:
   - escolha **Channel: Left**;
   - marque **Reverse buffer**;
   - clique em **Play**.
4. A segunda voz fornece:

   ```text
   (1,2) (2,2) (3,1) (4,6) (5,4) (6,5) (7,2) (8,2) (9,2)
   ```

5. Abra novamente `borrower_index.txt`:

   ```text
   1. Dyer
   2. Whateley
   3. Akeley
   4. Gilman
   5. Carter
   6. Marsh
   7. Olmstead
   8. Peaslee
   9. Bishop
   ```

6. Cada par significa `(número do sobrenome, posição da letra)`:

   - D**y**er → Y
   - W**h**ateley → H
   - **A**keley → A
   - Gilma**n** → N
   - Car**t**er → T
   - Mars**h** → H
   - O**l**mstead → L
   - P**e**aslee → E
   - B**i**shop → I

O resultado é:

```text
YHANTHLEI
```

7. Pesquise `YHANTHLEI` no Internet Explorer.

Isso abre o registro hidrográfico e libera `CHAPTER_SEVEN`.

Neste momento, o transcript só informa que a segunda voz corresponde ao arquivo de ditados
da equipe; a identidade mais próxima foi retida administrativamente.

## 6. A linhagem

A página de Y'ha-nthlei mostra:

```text
1798, 1863, 1912, 1949, 1977, 1998, 2014
```

Os intervalos são:

```text
65, 49, 37, 28, 21, 16
```

Cada intervalo retém aproximadamente ¾ do anterior. O próximo é cerca de 12:

```text
2014 + 12 = 2026
```

Pesquise no Internet Explorer:

```text
2026
```

O catálogo exibe um registro de Sarah criado amanhã. Isso provoca:

- corrupção no estágio 2;
- aceleração do relógio;
- chegada do e-mail `you opened it`;
- liberação de `access_log.txt`, `the_pattern.txt`, `toms_last_message.txt` e
  `the_name.txt`.

Leia o novo e-mail e os arquivos antes de continuar. Eles não são opcionais para compreender
a história, mesmo que nem todos sejam necessários para os gates técnicos.

## 7. O log do futuro

Abra `access_log.txt`. Ele contém:

```text
03:12  TRANSFORM  114VER~1.TIF /MIRROR
03:13  PLAY       COUNTI~1.WAV /LEFT /REVERSE
03:14  OPEN       THENAM~1.TXT
03:15  RUN        INDEX.EXE /JOIN [4 REFERENCES LOST]
```

Você precisa repetir as três primeiras ações exatamente nessa ordem:

1. Abra `114_verso.tif` e clique em **Mirror**.
2. Abra `counting.wav`, selecione **Left**, marque **Reverse buffer** e clique em **Play**.
3. Abra `the_name.txt`.

Não é necessário repetir **Invert** ou ajustar o contraste nessa segunda passagem.

Se você abrir o arquivo errado, usar outra operação de imagem ou executar os passos fora de
ordem, apenas essa sequência é reiniciada. Repita os três passos desde o começo.

Ao completar a ordem:

- a corrupção chega ao estágio 3;
- `INDEX.HLP` aparece em `CHAPTER_SEVEN`;
- quatro referências passam a ser reveladas nos metadados.

Abra novamente **Properties** de `counting.wav`. Depois de `future_log`, surgem:

```text
VOICE 1: S. BISHOP
VOICE 2: M. BISHOP (LEGACY DICTATION MATCH, ACCOUNT CLOSED 1998)
```

No MSN, a conversa da biblioteca também recebe:

```text
SYSTEM: Legacy account M.BISHOP is still authenticated.
Session duration: 10,227 days.
```

## 8. As quatro referências

Colete todas depois de resolver o log do futuro:

### A1 — imagem

Abra `114_verso.tif` e clique em **Properties** dentro do Image Viewer.

```text
OBJECT REF: A1
```

### C4 — áudio

Abra `counting.wav` e clique em **Properties** dentro do Media Player.

```text
CUE REF: C4
```

### E7 — e-mail

Abra Outlook Express e selecione o e-mail de Sarah:

```text
you opened it
```

O `Message-ID` termina em `E7`.

### B9 — relógio ou access log

Há duas formas:

- clique no relógio da barra de tarefas e leia a janela **Date/Time Properties**; ou
- abra `access_log.txt` e clique em **Properties** na barra superior do Notepad. Também é
  possível selecioná-lo com um clique no Explorer e usar o botão **Properties** do Explorer.

```text
OBJECT REF: B9
```

A referência só aparece depois que a sequência do log do futuro foi concluída.

Os metadados dão a ordem cronológica usada pelo Indexer:
`E7 03:11 → A1 03:12 → C4 03:13 → B9 03:14`.

## 9. O nome que não pode ser escrito

Antes de executar o Indexer, volte ao **Casefile.exe → Achados**. Três novos achados
estão visíveis no Ato 3:

1. **Sarah está retida em `tomorrow`, sempre `one day ahead` do observador.**
   - extraia ambos do e-mail `you opened it`;
   - anexe o e-mail e `access_log.txt` ou `DO_NOT_OPEN.txt`.
2. **Um `observer` vivo ocupa o `archive field`.**
   - extraia `observer` de `toms_last_message.txt`;
   - extraia `archive field` de `2014_RECORD.DAT`;
   - anexe a mensagem de Tom e o registro de 2014 ou `INDEX.HLP`.
3. **O capítulo sete é o `act of reconstruction` realizado pelo `observer`.**
   - extraia o ato de `the_name.txt`;
   - reutilize `observer`;
   - anexe `the_name.txt` e ao menos um componente do ritual.

Sem as três frases completas, o comando responde que a reconstrução do caso está
incompleta, mesmo que todas as referências estejam corretas.

1. Leia `INDEX.HLP`. Ele informa:

   ```text
   INDEX /JOIN <REF-REF-REF-REF>
   ```

2. Abra `Start → Run...`.
3. Digite exatamente:

   ```text
   INDEX /JOIN E7-A1-C4-B9
   ```

Maiúsculas e espaços extras são tolerados, mas a ordem das referências não muda.

Se o Windows responder que não encontrou o arquivo, normalmente falta coletar uma das quatro
referências. Volte à seção anterior.

Quando o comando funciona:

- a máquina monta o nome sem você digitá-lo;
- o nome aparece brevemente em runas e se corrompe;
- a pasta `Sarah Bishop` passa a usar o seu nome ou `NEXT USER`;
- o relógio mostra amanhã;
- a corrupção chega ao estágio 4;
- surge o **RECOVERED PROGRAM**.

## 10. Os três finais

Abra o programa pelo aviso ou pelo Start Menu.

### RESTORE SARAH

Escolha **RESTORE SARAH**.

Sarah envia um sinal e reaparece no presente. O computador reinicia como `sarah.bishop`, mas
agora encontra documentos recentes pertencentes ao jogador, todos datados de amanhã.
Entre a perda do sinal e o reboot, o terminal registra
`SECOND SESSION RETAINED — M.B.`. Em `welcome_back.txt`, a segunda sessão continua aberta e
restam apenas os campos `TOMATO / SARAH / FINISH —`.

**Significado:** Sarah só consegue sair trocando de posição com o observador. O jogo não
declara isso diretamente, mas o jogador ocupa o lugar temporal em que ela estava presa.

### SHUT DOWN

Escolha **SHUT DOWN**.

O ritual fica incompleto e o Windows desliga. Depois, abra o Outlook Express. Há um novo
e-mail de Sarah:

```text
Thank you for stopping.
I'm sorry I have to try again.
Tom asked me to say: the coffee was never that bad.
The counting paused when you chose. One breath. That's how I know she heard it too.
```

**Significado:** o jogador não é substituído, mas Sarah continua presa. O arquivo procura
outra pessoa. Recusar-se a terminar não destrói a Testemunha; apenas transfere a investigação
para o próximo observador.

### SEAL RELAY — final secreto

Antes de escolher RESTORE ou SHUT DOWN, encontre as seis correlações em
**Casefile.exe → Correlações**:

1. Lote 114 + Miriam + diário → o segundo volume voltou através das Bishop.
2. Miriam + Sarah + padrão da linhagem → ambas ocupam o mesmo campo.
3. Sarah + Tom + log futuro → a cópia cria seu destinatário.
4. incidente + manutenção + memorando Whitfield → supressão institucional.
5. notas de Miriam + carta a Robert + caderno de Miriam → Miriam interrompeu o catálogo.
6. log futuro + `INDEX.HLP` + `2014_RECORD.DAT` ou `LOOPBACK.EXE.txt` → o arquivo pode
   observar a si mesmo.

Isso revela `CONTAIN.HLP`. Cruze sua sintaxe com `LOOPBACK.EXE.txt` e com o identificador
mostrado no prólogo. Em `Run...`, execute:

```text
INDEX /SEAL RELAY-07 /WITNESS ARCHIVE
```

O arquivo passa a ocupar simultaneamente os campos de arquivo e testemunha. Sarah não é
restaurada, mas nenhum novo observador humano parece ser exigido. Depois, o checksum muda
sem operação de escrita. `RELAY_07.SEALED` acrescenta `COUNT: HELD`; a legenda informa que
a contagem não parou, apenas mudou de direção.

**Significado:** a contenção pode ter formado um circuito fechado — ou ensinado o arquivo a
se reproduzir sem pessoas. O jogo deliberadamente não confirma qual leitura é correta.

## Sistema de dicas

Abra `Start → Help`.

- após 12 minutos ativos, surge a primeira pista;
- após 25 minutos ativos, surge a segunda;
- **Recover another help fragment** solicita uma terceira pista mais explícita.

O cronômetro só avança enquanto a aba está visível. Case Notes, tentativas e pistas fazem
parte do save.

## Save e continuação

- O jogo salva automaticamente.
- A tela inicial mostra **Continue Case** quando encontra progresso.
- **New Case** cria um checkpoint antes de substituir o caso atual.
- **Import Case Code** valida e mostra nome, ato e data antes da importação.
- O código começa com `MISK6.` e inclui também o nome do jogador e suas Case Notes.
- Se duas abas abrirem o mesmo caso, a segunda entra em modo somente leitura.

## Easter eggs e conteúdo opcional

### Internet recuperada

No Internet Explorer:

- **Miskatonic University** contém a referência de Bellaso.
- **Arkham Gazette** conecta o caso Bishop aos relatos de William Dyer.
- **Geology Department** abre o arquivo da expedição Pabodie de 1930–31.
- **Antarctic-Net** contém uma estação automática ainda transmitindo `TEKELI-LI`.
- Pesquisar `TEKELI-LI`, `DANFORTH` ou abrir o frame danificado leva à página GeoCities de
  Danforth.

### Lixeira

Abra **Recycle Bin** e dê duplo clique em:

- `DANFORTH.URL` — abre o cache pessoal de Danforth;
- `EXPEDITION.TMP` — nota apagada do acampamento Lake.

Esses conteúdos não são necessários para concluir o jogo.

### My Pictures

- `late_again.png` mostra Sarah trabalhando no mesmo computador que pertenceu a Miriam.
- `mom_and_me_1998.png` confirma que Sarah tinha sete anos quando a mãe desapareceu.
- `innsmouth_trip.png` mostra Sarah e Em no litoral; as propriedades registram uma forma no
  mar que Em não se lembra de ter visto.
- `tom_after_symposium.png` mostra Sarah e Tom antes do desaparecimento e ajuda a explicar por
  que Tom arriscou copiar a máquina.
- `dads_65th.png` registra o último aniversário de família com Sarah presente.
- `RECOVERED/office_after.jpg` é a fotografia pericial descrita pela legenda homônima. Verifique
  **Properties**: o reflexo de Sarah aparece somente no frame 12.

### MSN Messenger

- **Tom Alvarez** menciona o Lote 114, Bellaso e um recibo de leitura anterior ao envio.
- **Em Bishop** liga a fotografia costeira à lembrança infantil de Sarah “contando nomes”.
- **Orne Library Desk** registra um login de `M.BISHOP` às 03:14, apesar de a conta ter sido
  encerrada em 1998.

As conversas arquivadas não são obrigatórias. No Ato 3, Sarah aparece online por poucos
segundos e permite uma resposta predefinida; a escolha altera a fala, não bloqueia conteúdo.

## Lore adicional

### O computador realmente veio de onde?

Tom Alvarez encontrou a máquina de Sarah, criou uma imagem forense e colocou o pacote
`SB-0316` na fila do Relay 07 para três colegas. Ele desapareceu antes de completar o envio.
Depois disso, um quarto destinatário passou a existir, mas o campo permanecia vazio.

O jogador não é amigo de Tom, colega de Sarah ou destinatário de um e-mail dentro da máquina.
É a pessoa que abriu um link anônimo para o relay. Nesse instante, o quarto destinatário é
gerado retroativamente e a sessão recebe a designação do observador.

O jogo não confirma se Sarah, agindo a partir de amanhã, contaminou a fila do relay ou se o
próprio arquivo fabricou essa explicação depois de ser observado. Tom nunca escolheu
pessoalmente o jogador. A imagem chega a qualquer pessoa que demonstre a disposição de
abri-la. Por isso:

> A curiosidade é o endereço.

### Por que um computador com Windows 98?

O computador pertencia originalmente a Miriam Bishop, mãe de Sarah. Miriam desapareceu em
1998 enquanto catalogava o depósito Whateley. Sarah manteve a máquina funcionando porque
parte das notas da mãe só existia nela.

O sistema antigo não é apenas estética: ele é uma camada arqueológica compartilhada por duas
investigações e duas gerações da família Bishop.

### O que é “amanhã”?

Não é uma data fixa. É um estado sempre 24 horas à frente de quem observa o computador.
Por isso os arquivos de amanhã usam a data real do jogador mais um dia.

Sarah não está simplesmente no futuro cronológico. Ela está presa numa distância temporal
que nunca pode ser alcançada esperando.

### Quem é a Testemunha Submersa?

Ela não é literalmente Cthulhu. Sarah usa R'lyeh e referências marítimas como aproximações
acadêmicas para algo que não consegue nomear.

Para essa entidade, passado e futuro são uma única lembrança simultânea. Ela não precisa
entrar fisicamente no mundo: precisa ser reconstruída dentro de uma mente. Resolver as
cifras, reconhecer padrões e ordenar referências são as etapas dessa reconstrução.

### O que é o capítulo sete?

O capítulo sete não é uma seção física do livro. Ele é o processo cognitivo executado pelo
leitor:

```text
Chapter seven is not in the book.
Chapter seven is the person trying to understand it.
```

O jogador não encontra o ritual. O jogador se torna o ritual ao organizar as evidências.

### A contagem não é uma contagem regressiva

Sarah percebe que a voz não conta dias. Ela conta pessoas: observadores necessários para
tornar a lembrança da entidade estável.

É por isso que o puzzle manda contar nomes, e não datas.

### Quem é a segunda voz?

Depois do `future_log`, as Properties identificam a segunda voz como Miriam Bishop por
correspondência com ditados antigos. O login de `M.BISHOP`, o laudo das margens de 1998 e
amanhã, o spool de impressão e a sessão de 10.227 dias apontam para a mesma conclusão:
Miriam continua ativa no intervalo temporal em que Sarah e Tom foram retidos.

O jogo não determina se Miriam conta para completar a sequência ou para atrasá-la. Ela nunca
fala em frases: aparece somente em números, campos, metadados e traços interrompidos.

### Relação com At the Mountains of Madness

Os sites sobre Dyer, Pabodie, Danforth, Gedney, o acampamento Lake, os quatorze espécimes e
`TEKELI-LI` são easter eggs.

A leitura sugerida — mas não confirmada — é que a expedição antártica encontrou uma
manifestação anterior do mesmo fenômeno: arquitetura, memória e tempo operando segundo regras
incompatíveis com a percepção humana. A fotografia que supostamente contém Sarah liga as duas
histórias sem afirmar que a Testemunha e os seres antárticos são a mesma criatura.

### Qual final é o “correto”?

Nenhum é moralmente limpo:

- **RESTORE SARAH** salva uma pessoa conhecida sacrificando o observador.
- **SHUT DOWN** preserva o jogador, abandona Sarah e deixa a máquina procurar outra vítima.
- **SEAL RELAY** remove o observador humano, mas talvez transforme o próprio arquivo numa
  testemunha autônoma.

O horror final não está em escolher errado. Está em perceber que o sistema só oferece
resultados que mantêm a cadeia funcionando.
