# Services BF1 TV - Documentation

Ce dossier contient tous les services pour communiquer avec l'API backend de BF1 TV.

## 📁 Structure des Services

### 🔐 Authentification & Utilisateur
- **authService.js** - Authentification (login, register, logout)
- **userService.js** - Gestion des utilisateurs
- **userSettingsService.js** - Paramètres utilisateur (notifications, thème, langue, etc.)

### 📺 Contenu
- **showService.js** - Émissions TV
- **movieService.js** - Films
- **newsService.js** - Actualités
- **reelService.js** - Reels/Shorts
- **replayService.js** - Replays
- **interviewService.js** - Interviews

### 📊 Programmes
- **trendingShowService.js** - Émissions tendances
- **popularProgramService.js** - Programmes populaires

### 💬 Interactions
- **favoriteService.js** - Gestion des favoris
- **likeService.js** - Gestion des likes
- **commentService.js** - Gestion des commentaires

### 🔔 Notifications & Abonnements
- **notificationService.js** - Notifications push
- **subscriptionService.js** - Abonnements premium

### 🆘 Support & Informations
- **supportService.js** - Support technique, tickets, FAQs
- **aboutService.js** - Informations sur l'application, équipe

### 🛠️ Utilitaires
- **locationService.js** - Services de géolocalisation

## 🚀 Utilisation

### Import Simple
```javascript
import userSettingsService from '../services/userSettingsService';

const settings = await userSettingsService.getMySettings();
```

### Import Groupé (Recommandé)
```javascript
import { 
  userSettingsService, 
  supportService, 
  aboutService 
} from '../services';

// Utiliser les services
const settings = await userSettingsService.getMySettings();
const faqs = await supportService.getFAQs();
const appInfo = await aboutService.getAppInfo();
```

## 📖 Exemples d'Utilisation

### User Settings
```javascript
// Récupérer les paramètres
const settings = await userSettingsService.getMySettings();

// Mettre à jour un paramètre
await userSettingsService.updateSetting('theme', 'dark');

// Changer la langue
await userSettingsService.changeLanguage('fr');

// Activer les notifications
await userSettingsService.updateNotificationSettings({
  push_notifications: true,
  live_notifications: true,
});
```

### Support
```javascript
// Créer un ticket de support
const ticket = await supportService.createTicket({
  subject: 'Problème de lecture',
  message: 'Les vidéos ne se chargent pas',
  category: 'bug',
  priority: 'high',
});

// Récupérer les FAQs
const faqs = await supportService.getFAQs();

// Rechercher dans les FAQs
const results = await supportService.searchFAQs('comment');
```

### About
```javascript
// Récupérer les infos de l'app
const appInfo = await aboutService.getAppInfo();

// Récupérer l'équipe
const team = await aboutService.getTeamMembers();

// Récupérer les liens sociaux
const socialLinks = await aboutService.getSocialLinks();
```

## 🔧 Configuration

Tous les services utilisent la configuration API centralisée dans `config/api.js`.

### Base URL
```javascript
// config/api.js
const API_URL = 'http://10.205.158.117:8000/api/v1';
```

### Authentification
Les services utilisent automatiquement le token JWT stocké dans AsyncStorage.

## 📝 Conventions

1. **Nommage** : Tous les services suivent le pattern `[nom]Service.js`
2. **Export** : Export par défaut d'un objet contenant toutes les méthodes
3. **Async/Await** : Toutes les méthodes sont asynchrones
4. **Gestion d'erreurs** : Try/catch avec console.error pour le debugging
5. **Documentation** : Commentaires JSDoc pour chaque méthode

## 🆕 Nouveaux Services Ajoutés

### userSettingsService.js
- ✅ Gestion complète des paramètres utilisateur
- ✅ Notifications, thème, langue, confidentialité
- ✅ Préférences de lecture vidéo

### supportService.js
- ✅ Création et gestion de tickets de support
- ✅ Système de FAQs avec recherche
- ✅ Helpers pour bugs, features, questions

### aboutService.js
- ✅ Informations de l'application
- ✅ Équipe BF1
- ✅ Liens sociaux et légaux
- ✅ Changelog et fonctionnalités

## 🔄 Mise à Jour

Pour ajouter un nouveau service :

1. Créer le fichier `[nom]Service.js`
2. Suivre la structure des services existants
3. Ajouter l'export dans `index.js`
4. Mettre à jour ce README

## 📞 Support

Pour toute question sur les services, consultez la documentation API backend ou contactez l'équipe de développement.
