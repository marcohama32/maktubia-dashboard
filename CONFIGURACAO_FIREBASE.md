# 🔥 Configuração do Firebase para Push Notifications

## 📋 Onde Obter as Configurações

### 1. Acessar Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Faça login com sua conta Google
3. Selecione seu projeto ou crie um novo projeto

### 2. Obter Firebase Config (Web App)

1. No Firebase Console, vá em **⚙️ Project Settings** (ícone de engrenagem)
2. Role até a seção **"Your apps"**
3. Se já tiver um app web criado, clique nele
4. Se não tiver, clique em **"</>" (Add app)** → **Web**
5. Dê um nome ao app (ex: "Maktubia Dashboard")
6. **Copie as configurações** que aparecem:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 3. Obter VAPID Key (Web Push) - ⚠️ IMPORTANTE: Você precisa fazer isso!

1. No Firebase Console, vá em **⚙️ Project Settings**
2. Clique na aba **"Cloud Messaging"** (aba do lado de "General")
3. Role até a seção **"Web Push certificates"**
4. **Se já existir uma chave**, copie o valor do campo **"Key pair"**
5. **Se não existir**, clique no botão **"Generate key pair"**
6. **Copie a chave** gerada (será algo como: `BKxXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
7. **Cole no arquivo `.env.local`** na variável `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

**⚠️ ATENÇÃO:** Sem a VAPID Key, as push notifications NÃO funcionarão!

## 🔧 Como Configurar no Projeto

### 1. Criar arquivo `.env.local`

Na raiz do projeto (mesmo nível do `package.json`), crie ou edite o arquivo `.env.local`:

```env
# Firebase Configuration (obrigatório para push notifications)
# Obter do Firebase Console: Project Settings > General > Your apps > Web app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# VAPID Key para Web Push (obrigatório para push notifications web)
# Obter do Firebase Console: Project Settings > Cloud Messaging > Web Push certificates
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BKxXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. Substituir os Valores

Substitua os valores de exemplo pelos valores reais do seu projeto Firebase:

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Valor do campo `apiKey` do Firebase Config
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Valor do campo `authDomain` do Firebase Config
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Valor do campo `projectId` do Firebase Config
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Valor do campo `storageBucket` do Firebase Config
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Valor do campo `messagingSenderId` do Firebase Config
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Valor do campo `appId` do Firebase Config
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`: Valor da Key pair gerada em Cloud Messaging

### 3. Reiniciar o Servidor

Após configurar o `.env.local`:

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar o servidor
npm run dev
```

## ✅ Verificar se Funcionou

Após reiniciar o servidor e fazer login, você deve ver nos logs:

```
✅ Firebase App inicializado
✅ Firebase Messaging inicializado
✅ Token FCM obtido: ...
✅ Token FCM registrado no backend
✅ Push notifications habilitadas
```

Se aparecer:
```
⚠️ FCM não configurado. Configure NEXT_PUBLIC_FIREBASE_* no .env
```

Isso significa que:
1. O arquivo `.env.local` não foi criado ou não está na raiz do projeto
2. As variáveis não começam com `NEXT_PUBLIC_`
3. Os valores não foram configurados corretamente
4. O servidor não foi reiniciado após configurar

## 📝 Exemplo Completo

### Firebase Console → Configurações:

**Project Settings > General > Your apps:**
```javascript
apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456"
authDomain: "maktubia-dashboard.firebaseapp.com"
projectId: "maktubia-dashboard"
storageBucket: "maktubia-dashboard.appspot.com"
messagingSenderId: "123456789012"
appId: "1:123456789012:web:abcdef1234567890"
```

**Project Settings > Cloud Messaging > Web Push certificates:**
```
Key pair: BKxAbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=maktubia-dashboard.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=maktubia-dashboard
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=maktubia-dashboard.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BKxAbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

## ⚠️ IMPORTANTE

1. **Nunca commite o `.env.local`** - Ele já está no `.gitignore`
2. **Variáveis devem começar com `NEXT_PUBLIC_`** - Necessário para serem acessíveis no browser
3. **Reinicie o servidor** após configurar
4. **Mantenha as credenciais seguras** - Não compartilhe com pessoas não autorizadas

## 🔗 Links Úteis

- [Firebase Console](https://console.firebase.google.com/)
- [Documentação Firebase Web](https://firebase.google.com/docs/web/setup)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

