# **Syncify**
![image](https://github.com/GitGinocchio/Syncify/assets/106624847/cad7da49-2222-4212-aed2-962759ef81ab)
**Syncify** è un'applicazione innovativa che ti permette di ascoltare musica in modo **sincronizzato** con i tuoi amici utilizzando le API di **Spotify**. Puoi **creare** sessioni di ascolto condivise e **unirti** a quelle create da altri, offrendo un'esperienza musicale collaborativa e interattiva. L'applicazione offre un'interfaccia intuitiva per gestire e controllare la riproduzione musicale, garantendo una sincronizzazione precisa per un'esperienza di ascolto davvero condivisa. Syncify è completamente basato sul **web**, quindi **non** dovrai **installare** nulla! Basta accedere al sito web, creare una sessione o unirsi a una esistente, e iniziare a condividere la musica!

- **Nessun download**: Syncify è un'**applicazione web**, quindi non è necessario scaricare o installare nulla sul tuo dispositivo.

- **Nessuna registrazione**: Per accedere al sito è **sufficiente** avere l'accesso al proprio **account Spotify**.

- **Ascolto sincronizzato**: Goditi la tua musica preferita insieme ad altre persone, indipendentemente da **dove si trovino**.

- **Crea e unisciti a sessioni**: Avvia le tue sessioni di ascolto o partecipa a quelle dei tuoi amici per **scoprire** nuove canzoni e artisti. 

- **Condividi la tua musica**: Mostra i tuoi **gusti musicali** e scopri quelli degli altri, rendendo ogni sessione un'opportunità per esplorare nuovi brani. 

------

## Indice

1. [Introduzione](#Introduzione)

2. [Utilizzo](#Installazione)

3. [Funzionamento](#Funzionamento)

------

## Introduzione 
**Syncify** è progettato per migliorare l'esperienza di ascolto musicale offerta da Spotify, puoi sincronizzare la riproduzione di brani **tra più dispositivi**, permettendo a te e ai tuoi amici di ascoltare le stesse canzoni nello **stesso momento**. Perfetto per feste virtuali, serate di ascolto con amici a distanza, o semplicemente per condividere le tue canzoni preferite in tempo reale. Syncify è **facile** da usare e ricco di **funzionalità**. Che tu stia creando una nuova sessione o unendoti a una esistente, l'applicazione offre un'**interfaccia intuitiva** per gestire e controllare la riproduzione musicale. Inoltre, la sincronizzazione precisa assicura che tutti i partecipanti ascoltino la musica nello stesso istante, creando un'**esperienza** di ascolto davvero condivisa. 

------

## Utilizzo

1. **Accedi al sito web**:
   - Vai al sito web di Syncify: [**www.syncify.com**](http://www.syncify.com).
2. **Effettua il login con Spotify**:
   - Clicca su "Get Started" e autorizza l'applicazione ad accedere al tuo account Spotify. Non è necessaria alcuna registrazione aggiuntiva!
     (**Non** vengono richiesti **dati personali** e tutti i vostri dati sono temporanei!)
3. **Crea o unisciti a una sessione**:
   - **Crea una nuova sessione**: Clicca su "Create a Session" e segui le istruzioni per avviare una nuova sessione di ascolto. 
     (Puoi invitare i tuoi amici condividendo il codice della sessione)
   - **Unisciti a una sessione esistente**: Inserisci il codice della sessione a cui desideri unirti e clicca su "Unisciti".

------

## Funzionamento

1. **Accesso**:
   - Dopo aver cliccato il bottone "Accedi" il sito ti reindirizzerà ad una pagina esterna (messa a disposizione dall'api di Spotify), con la quale potrai accedere con il tuo account. Questa pagina ha il compito di **autenticarti**, garantendo che non stia accedendo qualcun'altro al posto tuo.
   - Se il login viene eseguito con successo, verrai reindirizzato sulla pagina del tuo account e nel mentre invierai anche un **token temporaneo** (che verrà rinnovato se ce ne sarà il bisogno) al server di Syncify che verrà utilizzato successivamente per **autorizzare** l'applicazione ad eseguire alcune operazioni come la sincronizzazione delle canzoni.
   - Oltre a questo, nel tuo dispositivo verrà salvato un **cookie temporaneo** che servirà al server per autenticare la tua sessione, allo scadere di questo cookie (**dopo 24 ore**) il sito richiederà di riaccedere (Questa misura di sicurezza è dovuta dal fatto che non è necessaria una registrazione).
2. **Area Utente**:
- In Quest'area, accessibile solamente dopo aver eseguito l'accesso, l'utente avrà la possibilità di scegliere tra **creare una sessione** o **unirsi ad una esistente** utilizzando il codice della sessione e la password della sessione se presente.
  
- è inoltre possibile **scollegare** l'account di Spotify dall'applicazione, che sarà svolto in modo **instantaneo** per il tuo dispositivo, ma che allo stesso tempo impiegherà del tempo per la rimozione dei dati dall'interno della sessione del server
3. **Creazione di una sessione**:
   - Area in cui l'utente potrà creare una sessione con:
     - **Nome della sessione**: Nome con il quale la tua sessione sarà visibile agli altri utenti.
     - **Numero massimo di utenti**: Numero massimo di utenti che possono accedere alla tua sessione.
     - **Coda modificabile da chiunque**: Decidi se la coda della musica può essere modificabile da chiunque o solo da te o da chi preferisci
     - **Visibilità della stanza**: Decidi se la stanza deve essere privata (richiede la creazione di una password) o pubblica (accessibile da chiunque)
