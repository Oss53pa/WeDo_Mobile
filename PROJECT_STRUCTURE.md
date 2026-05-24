# TontineDigital - Structure du Projet

## 📁 Architecture des Dossiers

```
TontineDigital/
├── src/
│   ├── assets/              # Ressources statiques
│   │   ├── fonts/          # Polices personnalisées
│   │   ├── images/         # Images (logos, illustrations)
│   │   └── icons/          # Icônes
│   │
│   ├── components/          # Composants réutilisables
│   │   ├── common/         # Composants génériques (Button, Input, Card, etc.)
│   │   ├── tontine/        # Composants spécifiques aux tontines
│   │   ├── auth/           # Composants d'authentification
│   │   ├── payment/        # Composants de paiement
│   │   └── profile/        # Composants de profil
│   │
│   ├── screens/             # Écrans de l'application
│   │   ├── auth/           # Écrans d'authentification
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── VerifyOTPScreen.tsx
│   │   │
│   │   ├── home/           # Écran d'accueil
│   │   │   └── HomeScreen.tsx
│   │   │
│   │   ├── tontine/        # Écrans de gestion de tontines
│   │   │   ├── TontinesListScreen.tsx
│   │   │   ├── TontineDetailScreen.tsx
│   │   │   ├── CreateTontineScreen.tsx
│   │   │   └── ExploreTontinesScreen.tsx
│   │   │
│   │   ├── payment/        # Écrans de paiement
│   │   │   ├── PaymentFlowScreen.tsx
│   │   │   └── PaymentHistoryScreen.tsx
│   │   │
│   │   ├── profile/        # Écrans de profil
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── EditProfileScreen.tsx
│   │   │
│   │   ├── chat/           # Écrans de messagerie
│   │   │   └── ChatScreen.tsx
│   │   │
│   │   └── settings/       # Écrans de paramètres
│   │       └── SettingsScreen.tsx
│   │
│   ├── navigation/          # Configuration de la navigation
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── services/            # Services et intégrations
│   │   ├── api/            # Appels API
│   │   │   ├── client.ts
│   │   │   ├── auth.api.ts
│   │   │   ├── tontine.api.ts
│   │   │   ├── payment.api.ts
│   │   │   └── user.api.ts
│   │   │
│   │   ├── storage/        # Stockage local (AsyncStorage)
│   │   │   └── storage.service.ts
│   │   │
│   │   ├── notifications/  # Service de notifications
│   │   │   └── notification.service.ts
│   │   │
│   │   ├── biometric/      # Authentification biométrique
│   │   │   └── biometric.service.ts
│   │   │
│   │   └── mobileMoney/    # Intégrations Mobile Money
│   │       └── mobileMoney.service.ts
│   │
│   ├── store/               # State Management (Redux Toolkit)
│   │   ├── slices/         # Redux slices
│   │   │   ├── auth.slice.ts
│   │   │   ├── user.slice.ts
│   │   │   ├── tontine.slice.ts
│   │   │   └── notification.slice.ts
│   │   │
│   │   ├── selectors/      # Redux selectors
│   │   │   └── index.ts
│   │   │
│   │   └── store.ts        # Configuration du store
│   │
│   ├── hooks/               # Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── useTontines.ts
│   │   ├── usePayment.ts
│   │   └── useTheme.ts
│   │
│   ├── utils/               # Fonctions utilitaires
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── calculations.ts
│   │   └── helpers.ts
│   │
│   ├── types/               # Définitions TypeScript
│   │   ├── user.types.ts
│   │   ├── tontine.types.ts
│   │   ├── payment.types.ts
│   │   ├── chat.types.ts
│   │   ├── vote.types.ts
│   │   ├── notification.types.ts
│   │   └── index.ts
│   │
│   ├── theme/               # Système de thème
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   │
│   └── constants/           # Constantes de l'application
│       └── index.ts
│
├── android/                 # Code natif Android
├── ios/                     # Code natif iOS
├── __tests__/              # Tests
├── .env.example            # Variables d'environnement (exemple)
├── .eslintrc.js            # Configuration ESLint
├── .prettierrc.js          # Configuration Prettier
├── babel.config.js         # Configuration Babel
├── jest.config.js          # Configuration Jest
├── metro.config.js         # Configuration Metro
├── tsconfig.json           # Configuration TypeScript
├── package.json            # Dépendances et scripts
├── App.tsx                 # Composant racine
├── index.js                # Point d'entrée
└── README.md               # Documentation principale
```

## 🎨 Système de Thème

### Couleurs
- **Primaire** : Vert émeraude (#00C853) - Croissance, prospérité
- **Secondaire** : Or (#FFC107) - Richesse, réussite
- **Fonctionnelles** : Succès, Erreur, Attention, Info

### Typographie
- **Police** : Inter/Poppins ou System Font
- **Variantes** : H1, H2, H3, Body, Caption, Button

### Espacement
- Système basé sur une grille de 8px
- Tailles : xs (4px), sm (8px), md (16px), lg (24px), xl (32px)

## 🔧 Technologies Utilisées

### Frontend Mobile
- **React Native** 0.75.4
- **TypeScript** 5.0.4
- **React Navigation** 6.x (Stack + Bottom Tabs)
- **Redux Toolkit** 2.x (State Management)

### UI/UX
- **React Native Vector Icons** (Icônes)
- **React Native Gesture Handler** (Gestes)
- **React Native Reanimated** (Animations)
- **React Native Linear Gradient** (Gradients)

### Formulaires et Validation
- **React Hook Form** 7.x
- **Zod** 3.x (Schémas de validation)

### Services
- **Axios** (HTTP Client)
- **React Native Config** (Variables d'environnement)
- **React Native Keychain** (Stockage sécurisé)
- **React Native Biometrics** (Auth biométrique)
- **Firebase Cloud Messaging** (Notifications)

### Développement
- **ESLint** (Linting)
- **Prettier** (Formatage)
- **Jest** (Tests unitaires)

## 📱 Flux de Navigation

### Authentification (Non authentifié)
```
Welcome → Login/Register → VerifyOTP → CreatePIN → SetupBiometric → LinkMobileMoney
```

### Principal (Authentifié)
```
Bottom Tabs:
├── Home (Accueil)
├── Tontines (Mes Tontines)
├── Create (Créer)
├── Messages
└── Profile

Écrans modaux:
├── TontineDetail
├── CreateTontine (Wizard 5 étapes)
├── PaymentFlow
├── Chat
├── Settings
└── Notifications
```

## 🔐 Gestion de l'État (Redux)

### Slices
- **auth** : Authentification, tokens, session
- **user** : Profil utilisateur, réputation, statistiques
- **tontine** : Tontines actives, historique, détails
- **payment** : Contributions, distributions, historique
- **notification** : Notifications, préférences
- **chat** : Messages, conversations

## 🛠️ Scripts Disponibles

```bash
# Développement
npm start              # Démarrer Metro bundler
npm run ios            # Lancer sur iOS
npm run android        # Lancer sur Android

# Code Quality
npm run lint           # Linter le code
npm run format         # Formater le code
npm run type-check     # Vérifier les types TypeScript

# Tests
npm test               # Lancer les tests
npm run test:watch     # Tests en mode watch
npm run test:coverage  # Génération du coverage
```

## 📝 Conventions de Code

### Nommage
- **Composants** : PascalCase (ex: `UserProfile.tsx`)
- **Fichiers utilitaires** : camelCase (ex: `validation.ts`)
- **Constantes** : UPPER_SNAKE_CASE (ex: `API_BASE_URL`)
- **Types/Interfaces** : PascalCase (ex: `User`, `TontineDetail`)

### Structure de fichier
```typescript
// 1. Imports
import React from 'react';
import {View, Text} from 'react-native';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Composant
const MyComponent: React.FC<Props> = ({...}) => {
  // ...
};

// 4. Styles
const styles = StyleSheet.create({
  // ...
});

// 5. Export
export default MyComponent;
```

### Commits
Format : `type(scope): message`

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Exemple : `feat(auth): add biometric authentication`

## 🧪 Tests

### Structure des tests
```
__tests__/
├── components/
├── screens/
├── services/
├── utils/
└── __mocks__/
```

### Couverture cible
- **Statements** : ≥ 80%
- **Branches** : ≥ 80%
- **Functions** : ≥ 80%
- **Lines** : ≥ 80%

## 🚀 Prochaines Étapes

1. ✅ Structure du projet initialisée
2. ✅ Configuration des outils de développement
3. ✅ Système de thème créé
4. ✅ Types TypeScript définis
5. ✅ Navigation de base configurée
6. 🔄 Création des composants UI réutilisables
7. 🔄 Implémentation des écrans d'authentification
8. 🔄 Configuration Redux Store
9. 🔄 Services API
10. 🔄 Écrans principaux (Home, Tontines, Profile)

## 📚 Documentation Supplémentaire

- [Cahier des Charges Complet](../README.md)
- [Guide de Contribution](CONTRIBUTING.md) *(à créer)*
- [API Documentation](API.md) *(à créer)*
- [Style Guide](STYLE_GUIDE.md) *(à créer)*

---

**Maintenu par** : L'équipe TontineDigital
**Dernière mise à jour** : 2025-11-03
