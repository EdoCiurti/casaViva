# 🏡 CasaViva

ArredoVivo è un e-commerce innovativo dedicato alla vendita di mobili e arredamenti, con un'esperienza utente avanzata grazie all'integrazione della realtà aumentata (AR). La piattaforma offre un catalogo ricco, un carrello intuitivo, un checkout sicuro e una gestione avanzata degli ordini, il tutto con un design moderno e reattivo.

## 🚀 Caratteristiche principali
- **📦 Catalogo prodotti** con immagini, descrizioni e prezzi.
- **🛒 Carrello interattivo** per aggiungere/rimuovere prodotti con aggiornamento in tempo reale.
- **💳 Checkout sicuro** con metodi di pagamento come PayPal e Stripe.
- **🔍 Filtri e ricerca avanzata** per una navigazione intuitiva.
- **❤️ Wishlist** per salvare prodotti preferiti.
- **🛠 Pannello Admin** per la gestione di prodotti, ordini e utenti.
- **🕶 Integrazione AR** per visualizzare i mobili negli spazi reali (in sviluppo).

---

## 🏗 Architettura Tecnica

### 🎨 Frontend
- **Framework:** React.js / Vue.js
- **State Management:** Redux / Pinia
- **Styling:** Tailwind CSS / SCSS
- **Routing:** React Router / Vue Router
- **AR Integration:** Three.js / AR.js (da implementare)

### 🖥 Backend
- **Server:** Node.js con Express
- **Database:** MongoDB con Mongoose
- **Autenticazione:** JWT (JSON Web Token)
- **Pagamento:** Stripe API, PayPal API

### ☁️ Hosting & Deployment
- **Client:** Vercel / Netlify
- **Server:** AWS EC2 / Heroku
- **Database:** MongoDB Atlas
- **Storage:** AWS S3

---

## ⚡ Installazione e Avvio

### 1️⃣ Clonare il repository
```bash
git clone https://github.com/tuo-user/arredovivo.git
cd arredovivo
```

### 2️⃣ Installare le dipendenze
```bash
npm install  # per il backend
cd client && npm install  # per il frontend
```

### 3️⃣ Configurare le variabili d'ambiente
Creare un file `.env` nella root con le seguenti chiavi:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=tuo_secret
STRIPE_SECRET_KEY=...
PAYPAL_CLIENT_ID=...
```

### 4️⃣ Avviare il progetto
```bash
npm run dev  # Avvia backend e frontend insieme
```

---

## 📌 API Endpoints principali
| Metodo | Endpoint         | Descrizione |
|--------|----------------|-------------|
| GET    | /api/products  | Ottiene tutti i prodotti |
| GET    | /api/products/:id | Ottiene un prodotto specifico |
| POST   | /api/users/register | Registra un nuovo utente |
| POST   | /api/users/login | Effettua il login |
| POST   | /api/orders | Crea un nuovo ordine |

---

## 🔥 Funzionalità Future
- **🎥 Video preview dei prodotti** direttamente nell’e-commerce.
- **🛋️ AR migliorata** con supporto multipiattaforma.
- **📢 Sistema di recensioni e valutazioni** per ogni prodotto.
- **📈 Dashboard analytics** per gli amministratori.

---

## 🛠 Contributi
Se vuoi contribuire, effettua un fork del progetto e apri una Pull Request!

---

## 📝 Licenza
Questo progetto è rilasciato sotto licenza **MIT**.
