import api from '../config/api';

class LiveStreamService {
  constructor() {
    this.bf1Stream = {
      id: 'bf1',
      name: 'En direct',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
      isLive: true,
      viewers: 0,
      description: 'Chaîne de télévision BF1 en direct',
      schedule: '24/7 - Programmes en continu'
    };
    
    this.currentProgram = null;
    this.viewers = 0;
    
    // Initialiser le programme actuel
    this.updateCurrentProgram();
    
    // Démarrer la simulation de viewers
    this.simulateViewersUpdate();
    
    console.log('✅ LiveStreamService initialisé avec flux local');
  }

  // Mettre à jour le programme actuel selon l'heure
  updateCurrentProgram() {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 6 && currentHour < 12) {
      this.currentProgram = {
        title: 'Matinales BF1',
        description: 'Programmes du matin',
        start_time: '06:00',
        end_time: '12:00'
      };
    } else if (currentHour >= 12 && currentHour < 14) {
      this.currentProgram = {
        title: 'Journal de Midi',
        description: 'Actualités et informations',
        start_time: '12:00',
        end_time: '14:00'
      };
    } else if (currentHour >= 14 && currentHour < 18) {
      this.currentProgram = {
        title: 'Programmes de l\'après-midi',
        description: 'Divertissement et culture',
        start_time: '14:00',
        end_time: '18:00'
      };
    } else if (currentHour >= 18 && currentHour < 22) {
      this.currentProgram = {
        title: 'Prime Time',
        description: 'Programmes de première partie de soirée',
        start_time: '18:00',
        end_time: '22:00'
      };
    } else {
      this.currentProgram = {
        title: 'Programmes de nuit',
        description: 'Programmes en nocturne',
        start_time: '22:00',
        end_time: '06:00'
      };
    }
  }

  // Récupérer la chaîne BF1 (données locales)
  async getBF1Stream() {
    console.log('📺 Flux BF1 local:', this.bf1Stream.name);
    return this.bf1Stream;
  }

  // Récupérer le programme actuel (données locales)
  async getCurrentProgram() {
    this.updateCurrentProgram(); // Mettre à jour selon l'heure actuelle
    return this.currentProgram;
  }

  // Récupérer le nombre de viewers (données locales)
  async getViewers() {
    return this.viewers;
  }

  // Récupérer la programmation (données locales)
  async getSchedule() {
    return [
      {
        time: '06:00',
        title: 'Matinales BF1',
        description: 'Programmes du matin',
        duration: '6h'
      },
      {
        time: '12:00',
        title: 'Journal de Midi',
        description: 'Actualités et informations',
        duration: '2h'
      },
      {
        time: '14:00',
        title: 'Programmes de l\'après-midi',
        description: 'Divertissement et culture',
        duration: '4h'
      },
      {
        time: '18:00',
        title: 'Prime Time',
        description: 'Programmes de première partie de soirée',
        duration: '4h'
      },
      {
        time: '22:00',
        title: 'Programmes de nuit',
        description: 'Programmes en nocturne',
        duration: '8h'
      }
    ];
  }

  // Mettre à jour le nombre de viewers
  updateViewers(viewerCount) {
    this.bf1Stream.viewers = viewerCount;
  }

  // Vérifier si la chaîne est en direct
  isLive() {
    return this.bf1Stream.isLive;
  }

  // Obtenir le statut de la chaîne
  getStreamStatus() {
    return {
      isLive: this.bf1Stream.isLive,
      viewers: this.bf1Stream.viewers,
      name: this.bf1Stream.name,
      schedule: this.bf1Stream.schedule
    };
  }

  // Simuler une mise à jour en temps réel des viewers
  simulateViewersUpdate() {
    setInterval(() => {
      // Simuler des variations de viewers pour la chaîne BF1
      const variation = Math.floor(Math.random() * 50) - 25;
      this.bf1Stream.viewers = Math.max(100, this.bf1Stream.viewers + variation);
    }, 5000); // Mise à jour toutes les 5 secondes
  }

  // Mettre à jour l'URL du flux (pour changer de source si nécessaire)
  updateStreamUrl(newUrl) {
    this.bf1Stream.url = newUrl;
    console.log('📺 URL du flux BF1 mise à jour:', newUrl);
  }

  // Forcer le rafraîchissement de toutes les données
  async refreshAllData() {
    console.log('🔄 Rafraîchissement des données du flux BF1...');
    this.updateCurrentProgram();
    console.log('✅ Données du flux BF1 rafraîchies');
  }
}

export default new LiveStreamService();
