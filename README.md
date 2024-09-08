# **Syncify**
**Syncify** is an innovative application that allows you to listen to music in a synchronized manner with your friends using Spotify APIs. You can create shared listening sessions and join existing ones, offering a collaborative and interactive musical experience. The application provides an intuitive interface for managing and controlling music playback, ensuring precise synchronization for a truly shared listening experience. Syncify is completely web-based, so you won't need to install anything! Just access the website, create a session or join an existing one, and start sharing music!

- **No download**: Syncify is a **web application**, so no downloading or installation is required.

- **No registration**: To access the site, it's **sufficient** to have your own **Spotify account**.

- **Synchronized listening**: Enjoy your favorite music together with others, regardless of their location.

- **Create and join sessions**: Start your listening sessions or participate in those created by your friends to **discover** new songs and artists.

- **Share your music**: Show off your **musical tastes** and discover those of others, making every session an opportunity to explore new tracks.
------
![image](https://github.com/GitGinocchio/Syncify/assets/106624847/cad7da49-2222-4212-aed2-962759ef81ab)
## Index

1. [Introduction](#Introduction)

2. [Usage](#Usage)
3. [Functionality](#Functionality)
------
## Introduction

**Syncify** is designed to improve the musical experience offered by Spotify, allowing you to synchronize music playback across multiple devices, enabling you and your friends to listen to the same songs at the same time. Perfect for virtual parties, friend gatherings, or simply sharing your favorite tracks in real-time. Syncify is **easy** to use and rich in features. Whether you're creating a new session or joining an existing one, the application provides an **intuitive interface** for managing and controlling music playback. Moreover, precise synchronization ensures that all participants listen to the music at the same time, creating a truly shared listening experience.

------
## Usage

1. **Access the website**:
   - Go to Syncify's website: [**https://syncify.replit.app**](https://syncify.replit.app).
2. **Sign in with Spotify**:
   - Click on "Get Started" and authorize the application to access your Spotify account. No additional registration is required!
     (**No personal data will be requested**, and all your data are temporary!)
3. **Create or join a session**:
   - **Create a new session**: Click on "Create a Session" and follow the instructions to start a new listening session.
     (You can invite friends by sharing the session code)
   - **Join an existing session**: Enter the session code you want to join and click on "Join".
------
## Functionality

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
