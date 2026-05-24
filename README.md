# TontineDigital Mobile App

<div align="center">

![TontineDigital Logo](https://via.placeholder.com/200x200/00C853/FFFFFF?text=TD)

**La solution digitale complète pour moderniser les tontines traditionnelles en Afrique**

[![React Native](https://img.shields.io/badge/React%20Native-0.75.4-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.4-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[Documentation](#-documentation) • [Installation](#-installation) • [Développement](#-développement) • [Architecture](#-architecture)

</div>

---

## 📱 À Propos

**TontineDigital** est une application mobile révolutionnaire qui digitalise complètement le système traditionnel des tontines en Afrique. Elle combine :

- ✅ Automatisation complète avec IA
- ✅ Intégration Mobile Money (M-Pesa, Orange Money, MTN, Wave, etc.)
- ✅ Système de réputation pour la confiance
- ✅ Transparence totale en temps réel
- ✅ Sécurité renforcée (chiffrement, biométrie)

## 🚀 Installation

### Prérequis

- Node.js >= 18.x
- npm ou yarn
- React Native CLI
- Xcode (pour iOS, Mac uniquement)
- Android Studio (pour Android)

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/tontinedigital/mobile-app.git
cd mobile-app

# 2. Installer les dépendances
npm install

# 3. Installer les pods iOS (Mac uniquement)
cd ios && pod install && cd ..

# 4. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# 5. Lancer l'application
npm run ios     # Pour iOS
npm run android # Pour Android
```

## 🛠️ Développement

### Commandes disponibles

```bash
npm start              # Démarrer Metro bundler
npm run ios            # Lancer sur iOS
npm run android        # Lancer sur Android
npm run lint           # Linter le code
npm run format         # Formater avec Prettier
npm run type-check     # Vérifier les types TypeScript
npm test               # Lancer les tests
```

### Structure du projet

```
TontineDigital/
├── src/
│   ├── assets/         # Images, icônes, polices
│   ├── components/     # Composants réutilisables
│   ├── screens/        # Écrans de l'application
│   ├── navigation/     # Configuration navigation
│   ├── services/       # API, storage, notifications
│   ├── store/          # Redux state management
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Fonctions utilitaires
│   ├── types/          # Types TypeScript
│   ├── theme/          # Système de thème
│   └── constants/      # Constantes de l'app
├── android/            # Code natif Android
├── ios/                # Code natif iOS
└── __tests__/          # Tests
```

Voir [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) pour plus de détails.

## 🎨 Design System

### Couleurs

- **Primaire** : Vert émeraude `#00C853` (croissance, prospérité)
- **Secondaire** : Or `#FFC107` (richesse, réussite)
- **Fonctionnelles** : Succès, Erreur, Attention, Info

### Typographie

- **Police** : Inter/Poppins ou System Font
- **Variantes** : H1 (28sp), H2 (22sp), H3 (18sp), Body (16sp), Caption (14sp)

### Composants UI

- Button (Primary, Secondary, Text)
- Input (Text, Phone, PIN)
- Card, Avatar, Badge
- ProgressBar, StatusBadge
- EmptyState, LoadingSpinner

## 🏗️ Architecture

### Technologies

- **Frontend** : React Native 0.75.4 + TypeScript
- **Navigation** : React Navigation 6.x
- **State** : Redux Toolkit 2.x
- **Forms** : React Hook Form + Zod
- **UI** : Custom components + Material Design 3
- **Icons** : React Native Vector Icons

### Patterns

- **Architecture** : Feature-based folders
- **State Management** : Redux Toolkit slices
- **Styling** : StyleSheet avec système de thème
- **Navigation** : Type-safe avec TypeScript
- **API** : Axios avec interceptors

## 📊 Fonctionnalités Principales

### ✅ Phase 1 - MVP (Complété)
- [x] Structure du projet
- [x] Système de thème
- [x] Types TypeScript
- [x] Navigation de base

### 🔄 Phase 2 - En Cours
- [ ] Composants UI réutilisables
- [ ] Authentification (Login, Register, OTP, PIN, Biométrie)
- [ ] Configuration Redux Store
- [ ] Services API

### 📅 Phase 3 - À Venir
- [ ] Écran d'accueil (Dashboard)
- [ ] Gestion des tontines
- [ ] Système de paiement Mobile Money
- [ ] Chat et messagerie
- [ ] Système de votes
- [ ] Notifications push

Voir [GETTING_STARTED.md](GETTING_STARTED.md) pour la roadmap détaillée.

## 🧪 Tests

### Exécuter les tests

```bash
# Tests unitaires
npm test

# Tests avec coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Couverture cible

- Statements : ≥ 80%
- Branches : ≥ 80%
- Functions : ≥ 80%
- Lines : ≥ 80%

## 📚 Documentation

- [Guide de Démarrage](GETTING_STARTED.md) - Premiers pas
- [Structure du Projet](PROJECT_STRUCTURE.md) - Architecture détaillée
- [Cahier des Charges](../README.md) - Spécifications complètes
- [API Documentation](docs/API.md) - Documentation API *(à créer)*
- [Style Guide](docs/STYLE_GUIDE.md) - Conventions de code *(à créer)*

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'feat(scope): add amazing feature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Conventions de commit

Format : `type(scope): message`

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Exemple : `feat(auth): add biometric authentication`

## 🔐 Sécurité

Pour signaler une vulnérabilité de sécurité, envoyez un email à **security@tontinedigital.com**.

**Ne publiez pas** de vulnérabilités publiquement sur GitHub.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Product Owner** : TBD
- **Lead Developer** : TBD
- **UI/UX Designer** : TBD
- **QA Engineer** : TBD

## 📞 Contact

- **Site web** : https://www.tontinedigital.com
- **Email** : contact@tontinedigital.com
- **Support** : support@tontinedigital.com
- **Twitter** : [@TontineDigital](https://twitter.com/tontinedigital)

## 🙏 Remerciements

- Communautés africaines de tontines traditionnelles
- Partenaires Mobile Money
- Contributors et beta testers
- Open source community

---

<div align="center">

**Fait avec ❤️ pour l'Afrique**

[Documentation](GETTING_STARTED.md) • [Contribuer](#-contribution) • [Licence](LICENSE)

</div>
