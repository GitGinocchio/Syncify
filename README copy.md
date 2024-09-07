# **Syncify**
**Syncify** è un'applicazione innovativa che ti permette di ascoltare musica in modo **sincronizzato** con i tuoi amici utilizzando le API di **Spotify**. Puoi **creare** sessioni di ascolto condivise e **unirti** a quelle create da altri, offrendo un'esperienza musicale collaborativa e interattiva. L'applicazione offre un'interfaccia intuitiva per gestire e controllare la riproduzione musicale, garantendo una sincronizzazione precisa per un'esperienza di ascolto davvero condivisa. Syncify è completamente basato sul **web**, quindi **non** dovrai **installare** nulla! Basta accedere al sito web, creare una sessione o unirsi a una esistente, e iniziare a condividere la musica!

- **Nessun download**: Syncify è un'**applicazione web**, quindi non è necessario scaricare o installare nulla sul tuo dispositivo.

- **Nessuna registrazione**: Per accedere al sito è **sufficiente** avere l'accesso al proprio **account Spotify**.

- **Ascolto sincronizzato**: Goditi la tua musica preferita insieme ad altre persone, indipendentemente da **dove si trovino**.

- **Crea e unisciti a sessioni**: Avvia le tue sessioni di ascolto o partecipa a quelle dei tuoi amici per **scoprire** nuove canzoni e artisti.

- **Condividi la tua musica**: Mostra i tuoi **gusti musicali** e scopri quelli degli altri, rendendo ogni sessione un'opportunità per esplorare nuovi brani.
**Syncify** is an innovative application that allows you to listen to music in a synchronized manner with your friends using Spotify APIs. You can create shared listening sessions and join existing ones, offering a collaborative and interactive musical experience. The application provides an intuitive interface for managing and controlling music playback, ensuring precise synchronization for a truly shared listening experience. Syncify is completely web-based, so you won't need to install anything! Just access the website, create a session or join an existing one, and start sharing music!

- **No download**: Syncify is a **web application**, so no downloading or installation is required.

- **No registration**: To access the site, it's **sufficient** to have your own **Spotify account**.

- **Synchronized listening**: Enjoy your favorite music together with others, regardless of their location.

- **Create and join sessions**: Start your listening sessions or participate in those created by your friends to **discover** new songs and artists.

- **Share your music**: Show off your **musical tastes** and discover those of others, making every session an opportunity to explore new tracks.
------
![image](https://github.com/GitGinocchio/Syncify/assets/106624847/cad7da49-2222-4212-aed2-962759ef81ab)
## Indice
## Index

1. [Introduzione](#Introduzione)
1. [Introduction](#Introduction)

2. [Utilizzo](#Installazione)

3. [Funzionamento](#Funzionamento)

2. [Usage](#Usage)
3. [Functionality](#Functionality)
------

## Introduzione
**Syncify** è progettato per migliorare l'esperienza di ascolto musicale offerta da Spotify, puoi sincronizzare la riproduzione di brani **tra più dispositivi**, permettendo a te e ai tuoi amici di ascoltare le stesse canzoni nello **stesso momento**. Perfetto per feste virtuali, serate di ascolto con amici a distanza, o semplicemente per condividere le tue canzoni preferite in tempo reale. Syncify è **facile** da usare e ricco di **funzionalità**. Che tu stia creando una nuova sessione o unendoti a una esistente, l'applicazione offre un'**interfaccia intuitiva** per gestire e controllare la riproduzione musicale. Inoltre, la sincronizzazione precisa assicura che tutti i partecipanti ascoltino la musica nello stesso istante, creando un'**esperienza** di ascolto davvero condivisa.

## Introduction 
**Syncify** is designed to improve the musical experience offered by Spotify, allowing you to synchronize music playback across multiple devices, enabling you and your friends to listen to the same songs at the same time. Perfect for virtual parties, friend gatherings, or simply sharing your favorite tracks in real-time. Syncify is **easy** to use and rich in features. Whether you're creating a new session or joining an existing one, the application provides an **intuitive interface** for managing and controlling music playback. Moreover, precise synchronization ensures that all participants listen to the music at the same time, creating a truly shared listening experience.
------
## Usage

## Utilizzo

1. **Accedi al sito web**:
   - Vai al sito web di Syncify: [**https://syncify-0b6dc00d11b0.herokuapp.com**](https://syncify-0b6dc00d11b0.herokuapp.com).
2. **Effettua il login con Spotify**:
   - Clicca su "Get Started" e autorizza l'applicazione ad accedere al tuo account Spotify. Non è necessaria alcuna registrazione aggiuntiva!
     (**Non** vengono richiesti **dati personali** e tutti i vostri dati sono temporanei!)
3. **Crea o unisciti a una sessione**:
   - **Crea una nuova sessione**: Clicca su "Create a Session" e segui le istruzioni per avviare una nuova sessione di ascolto.
     (Puoi invitare i tuoi amici condividendo il codice della sessione)
   - **Unisciti a una sessione esistente**: Inserisci il codice della sessione a cui desideri unirti e clicca su "Unisciti".
1. **Access the website**:
   - Go to Syncify's website: [**https://syncify-0b6dc00d11b0.herokuapp.com**](https://syncify-0b6dc00d11b0.herokuapp.com).
2. **Sign in with Spotify**:
   - Click on "Get Started" and authorize the application to access your Spotify account. No additional registration is required!
     (**No personal data will be requested**, and all your data are temporary!)
3. **Create or join a session**:
   - **Create a new session**: Click on "Create a Session" and follow the instructions to start a new listening session.
     (You can invite friends by sharing the session code)
   - **Join an existing session**: Enter the session code you want to join and click on "Join".
------

## Funzionamento
## Functionality

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

1. **Access**:
   - After clicking the "Login" button, the site will redirect you to an external page (provided by Spotify's API), which will authenticate you, ensuring that no one else is accessing your account.
   - If the login is successful, you'll be redirected to your account page and a temporary token (which will be renewed if needed) will be sent to Syncify's server for **authorizing** the application to perform certain operations like music synchronization.
   - Additionally, a temporary cookie will be saved on your device that serves as authentication for the session, which will expire after 24 hours. The site will request you to re-login (This security measure is due to the fact that no registration is required).
2. **User Area**:
- In this area, accessible only after logging in, users have the option to choose between **creating a new session** or **joining an existing one** using the session code and password if present.
  
- It's also possible **to disconnect** your Spotify account from the application, which will be done instantly on your device, but it will take some time for the data to be removed from within the session server
3. **Creating a new session**:
   - Area where users can create a session with:
     - **Session name**: The name under which your session will be visible to other users.
     - **Maximum number of users**: The maximum number of users that can access your session.
     - **Modifiable queue**: Decide whether the music queue can be modified by anyone or only by you or those you prefer
     - **Session visibility**: Decide if the room should be private (requires creating a password) or public (accessible to anyone)
