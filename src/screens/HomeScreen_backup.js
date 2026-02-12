// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Image,
//   TouchableOpacity,
//   Dimensions,
//   ActivityIndicator,
//   Animated,
//   Modal,
//   RefreshControl
// } from 'react-native';
// import { Video } from 'react-native-video';
// import LinearGradient from 'react-native-linear-gradient';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { useFocusEffect } from '@react-navigation/native';
// import { useAuth } from '../contexts/AuthContext';
// import { colors } from '../contexts/ThemeContext';
// import showService from '../services/showService';
// import movieService from '../services/movieService';
// import newsService from '../services/newsService';
// import trendingShowService from '../services/trendingShowService';
// import popularProgramService from '../services/popularProgramService';
// import interviewService from '../services/interviewService';
// import archiveService from '../services/archiveService';
// import api from '../config/api';
// import liveStreamService from '../services/liveStreamService';
// import { formatRelativeTime } from '../utils/dateUtils';

// const { width, height } = Dimensions.get('window');

// export default function HomeScreen({ navigation }) {
//   const { user } = useAuth();
//   const [liveShows, setLiveShows] = useState([]);
//   const [breakingNews, setBreakingNews] = useState([]);
//   const [trendingShows, setTrendingShows] = useState([]);
//   const [recentVideos, setRecentVideos] = useState([]);
//   const [popularPrograms, setPopularPrograms] = useState([]);
//   const [interviews, setInterviews] = useState([]);
//   const [archives, setArchives] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
  
//   // État pour le flux BF1
//   const [bf1Stream, setBf1Stream] = useState(null);
//   const [bf1Program, setBf1Program] = useState(null);
//   const [bf1Viewers, setBf1Viewers] = useState(0);
  
//   // État pour le mode plein écran
//   const [isFullscreen, setIsFullscreen] = useState(false);
  
//   // Référence pour la vidéo
//   const videoRef = useRef(null);

//   // Animations
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.8)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;
//   const blinkAnim = useRef(new Animated.Value(1)).current;

//   // Animation de clignotement pour le badge "Live en cours"
//   useEffect(() => {
//     const blink = () => {
//       Animated.sequence([
//         Animated.timing(blinkAnim, {
//           toValue: 0.3,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//         Animated.timing(blinkAnim, {
//           toValue: 1,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//       ]).start(() => blink());
//     };
//     blink();
//   }, [blinkAnim]);

//   // Rafraîchissement automatique en arrière-plan à l'arrivée sur l'écran
//   useFocusEffect(
//     useCallback(() => {
//       // Rafraîchir silencieusement en arrière-plan sans afficher le loader
//       loadContentSilently();
//     }, [])
//   );

//   useEffect(() => {
//     loadContent();
//     startAnimations();
//   }, []);

//   const startAnimations = () => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         friction: 4,
//         tension: 40,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   // Fonction de rafraîchissement silencieux (sans loader)
//   const loadContentSilently = async () => {
//     try {
//       console.log('📺 Chargement silencieux des données...');
      
//       // Charger les autres sections depuis le backend
//       const [news, trending, popular, replays, interviewsData, archivesData] = await Promise.all([
//         newsService.getAllNews({ limit: 10 }).catch(err => {
//           console.error('Error loading news:', err);
//           return [];
//         }),
//         trendingShowService.getTrendingShows({ limit: 4 }).catch(err => {
//           console.error('Error loading trending shows:', err);
//           return [];
//         }),
//         popularProgramService.getAllPrograms({ limit: 4 }).catch(err => {
//           console.error('Error loading popular programs:', err);
//           return [];
//         }),
//         api.get('/replays', { params: { limit: 4 } }).then(response => 
//           response.data.map(replay => ({
//             ...replay,
//             id: replay._id || replay.id,
//             image_url: replay.thumbnail || replay.image_url
//           }))
//         ).catch(err => {
//           console.error('Error loading replays:', err);
//           return [];
//         }),
//         interviewService.getAllInterviews({ limit: 4 }).catch(err => {
//           console.error('Error loading interviews:', err);
//           return [];
//         }),
//         archiveService.getAllArchives({ limit: 4 }).catch(err => {
//           console.error('Error loading archives:', err);
//           return [];
//         }),
//       ]);
      
//       // Charger les données BF1 depuis le service local
//       const stream = await liveStreamService.getBF1Stream();
//       const program = await liveStreamService.getCurrentProgram();
//       const viewers = await liveStreamService.getViewers();
      
//       setLiveShows([]); // Plus de lives depuis le backend
//       setBreakingNews(news);
//       setTrendingShows(trending);
//       setPopularPrograms(popular);
//       setRecentVideos(replays);
//       setInterviews(interviewsData);
//       setArchives(archivesData);
      
//       // Mettre à jour les données BF1 locales
//       setBf1Stream(stream);
//       setBf1Program(program);
//       setBf1Viewers(viewers);
      
//       console.log('✅ Données chargées - BF1 depuis service local');
      
//     } catch (error) {
//       console.error('Error loading content silently:', error);
//     }
//   };

//   // Fonction de rafraîchissement manuel (pull-to-refresh)
//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await loadContentSilently();
//     setRefreshing(false);
//   }, []);

//   const loadContent = async () => {
//     try {
//       setLoading(true);
      
//       // Charger les autres sections depuis le backend
//       const [news, trending, popular, replays, interviewsData, archivesData] = await Promise.all([
//         newsService.getAllNews({ limit: 10 }).catch(err => {
//           console.error('Error loading news:', err);
//           return [];
//         }),
//         trendingShowService.getTrendingShows({ limit: 4 }).catch(err => {
//           console.error('Error loading trending shows:', err);
//           return [];
//         }),
//         popularProgramService.getAllPrograms({ limit: 4 }).catch(err => {
//           console.error('Error loading popular programs:', err);
//           return [];
//         }),
//         api.get('/replays', { params: { limit: 4 } }).then(response => 
//           response.data.map(replay => ({
//             ...replay,
//             id: replay._id || replay.id,
//             image_url: replay.thumbnail || replay.image_url
//           }))
//         ).catch(err => {
//           console.error('Error loading replays:', err);
//           return [];
//         }),
//         interviewService.getAllInterviews({ limit: 4 }).catch(err => {
//           console.error('Error loading interviews:', err);
//           return [];
//         }),
//         archiveService.getAllArchives({ limit: 4 }).catch(err => {
//           console.error('Error loading archives:', err);
//           return [];
//         }),
//       ]);
      
//       // Charger les données BF1 depuis le service local
//       const stream = await liveStreamService.getBF1Stream();
//       const program = await liveStreamService.getCurrentProgram();
//       const viewers = await liveStreamService.getViewers();
      
//       setLiveShows([]); // Plus de lives depuis le backend
//       setBreakingNews(news);
//       setTrendingShows(trending);
//       setPopularPrograms(popular);
//       setRecentVideos(replays);
//       setInterviews(interviewsData);
//       setArchives(archivesData);
      
//       // Mettre à jour les données BF1 locales
//       setBf1Stream(stream);
//       setBf1Program(program);
//       setBf1Viewers(viewers);
      
//     } catch (error) {
//       console.error('Error loading content:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fonction pour gérer le clic sur la vidéo
//   const handleVideoPress = () => {
//     setIsFullscreen(true);
//   };

//   // Fonction pour quitter le plein écran
//   const handleExitFullscreen = () => {
//     setIsFullscreen(false);
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={'#DC143C'} />
//       </View>
//     );
//   }

//   return (
//     <ScrollView 
//       style={styles.container} 
//       showsVerticalScrollIndicator={false}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           colors={['#DC143C']}
//           tintColor={'#DC143C'}
//           title="Rafraîchissement..."
//           titleColor={'#B0B0B0'}
//         />
//       }
//     >
//       {/* En Direct - Section BF1 */}
//       <View style={styles.liveSection}>
//         <View style={styles.liveSectionHeader}>
//           <View style={styles.liveTitleContainer}>
//             <Ionicons name="radio" size={24} color={'#DC143C'} />
//             <Text style={styles.liveSectionTitle}>En Direct</Text>
//           </View>
//           <TouchableOpacity
//             onPress={() => navigation.navigate('Live')}
//             activeOpacity={0.7}
//           >
//             <Animated.View style={[styles.programmedLiveContainer, { opacity: blinkAnim }]}>
//               <View style={styles.programmedLiveDot} />
//               <Text style={styles.programmedLiveText}>
//                 {bf1Stream?.is_live ? 'BF1 TV EN DIRECT' : 'BF1 TV'}
//               </Text>
//             </Animated.View>
//           </TouchableOpacity>
//         </View>
        
//         {bf1Stream ? (
//           <TouchableOpacity
//             style={styles.liveCardFull}
//             onPress={handleVideoPress}
//           >
//             <Video
//               source={{ uri: bf1Stream.url }}
//               style={styles.liveImageFull}
//               resizeMode="cover"
//               shouldPlay
//               isLooping
//               useNativeControls={false}
//               muted={true}
//               playInBackground={false}
//               playWhenInactive={false}
//             />
//             <LinearGradient
//               colors={['transparent', 'rgba(0,0,0,0.9)']}
//               style={styles.liveOverlayFull}
//             >
//               <View style={styles.liveBadgeFull}>
//                 <View style={styles.liveIndicatorFull} />
//                 <Text style={styles.liveTextFull}>
//                   BF1 TV EN DIRECT
//                 </Text>
//               </View>
//               <Text style={styles.liveTitleFull}>{bf1Stream.name}</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         ) : (
//           <View style={styles.noLiveContainer}>
//             <Ionicons name="radio-outline" size={60} color={'#B0B0B0'} />
//             <Text style={styles.noLiveText}>Chargement de BF1 TV...</Text>
//             <Text style={styles.noLiveSubtext}>Veuillez patienter</Text>
//           </View>
//         )}

//         {/* Modal Plein Écran */}
//         <Modal
//           visible={isFullscreen}
//           animationType="fade"
//           onRequestClose={handleExitFullscreen}
//         >
//           <View style={styles.fullscreenContainer}>
//             <Video
//               source={{ uri: bf1Stream?.url }}
//               style={styles.fullscreenVideo}
//               resizeMode="cover"
//               shouldPlay
//               isLooping
//               useNativeControls={false}
//               muted={false}
//               playInBackground={false}
//               playWhenInactive={false}
//             />
//             <TouchableOpacity
//               style={styles.fullscreenCloseButton}
//               onPress={handleExitFullscreen}
//             >
//               <Ionicons name="close" size={30} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </Modal>
//       </View>

//       {/* Flash Info */}
//       <View style={styles.section}>
//         <View style={styles.sectionHeaderWithButton}>
//           <View style={styles.sectionHeader}>
//             <Ionicons name="flash" size={24} color={'#DC143C'} />
//             <Text style={styles.sectionTitle}>Flash Info</Text>
//           </View>
//           <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('BreakingNews')}>
//             <Text style={styles.seeMoreText}>Voir plus</Text>
//             <Ionicons name="chevron-forward" size={16} color={'#DC143C'} />
//           </TouchableOpacity>
//         </View>
//         <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {breakingNews.length > 0 ? breakingNews.map((news) => (
//               <TouchableOpacity 
//                 key={news.id || news._id} 
//                 style={styles.newsCard}
//                 onPress={() => navigation.navigate('NewsDetail', { newsId: news.id || news._id })}
//               >
//                 <Image source={{ uri: news.image_url || news.image || 'https://via.placeholder.com/400x250' }} style={styles.newsImage} />
//                 <LinearGradient
//                   colors={['transparent', 'rgba(0,0,0,0.9)']}
//                   style={styles.newsOverlay}
//                 >
//                   <View style={styles.newsBadge}>
//                     <Ionicons name="flash" size={12} color="#fff" />
//                     <Text style={styles.newsBadgeText}>{news.category || news.edition || 'Actualités'}</Text>
//                   </View>
//                   <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
//                   <Text style={styles.newsTime}>{formatRelativeTime(news.created_at || news.published_at)}</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             )) : (
//               <View style={styles.emptyStateHorizontal}>
//                 <Ionicons name="newspaper-outline" size={48} color={'#B0B0B0'} />
//                 <Text style={styles.emptyStateText}>Aucune actualité disponible</Text>
//               </View>
//             )}
//           </ScrollView>
//         </Animated.View>
//       </View>

//       {/* Émissions Tendances */}
//       <View style={styles.section}>
//         <View style={styles.sectionHeaderWithButton}>
//           <View style={styles.sectionHeader}>
//             <Ionicons name="trending-up" size={24} color={'#DC143C'} />
//             <Text style={styles.sectionTitle}>Émissions Tendances</Text>
//           </View>
//           <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('TrendingShows')}>
//             <Text style={styles.seeMoreText}>Voir plus</Text>
//             <Ionicons name="chevron-forward" size={16} color={'#DC143C'} />
//           </TouchableOpacity>
//         </View>
//         <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {trendingShows.length > 0 ? trendingShows.map((show) => (
//               <TouchableOpacity 
//                 key={show.id || show._id} 
//                 style={styles.trendingCard}
//                 onPress={() => navigation.navigate('ShowDetail', { showId: show.id || show._id, isTrending: true })}
//               >
//                 <Image source={{ uri: show.image_url || show.image || 'https://via.placeholder.com/300x200' }} style={styles.trendingImage} />
//                 <View style={styles.trendingInfo}>
//                   <Text style={styles.trendingTitle} numberOfLines={1}>{show.title}</Text>
//                   <View style={styles.trendingMeta}>
//                     <Ionicons name="eye" size={14} color={'#B0B0B0'} />
//                     <Text style={styles.trendingViews}>{show.views_count || show.views || '0'} vues</Text>
//                   </View>
//                 </View>
//               </TouchableOpacity>
//             )) : (
//               <View style={styles.emptyStateHorizontal}>
//                 <Ionicons name="trending-up-outline" size={48} color={'#B0B0B0'} />
//                 <Text style={styles.emptyStateText}>Aucune émission tendance</Text>
//               </View>
//             )}
//           </ScrollView>
//         </Animated.View>
//       </View>

//       {/* Vidéos Récentes */}
//       <View style={styles.section}>
//         <View style={styles.sectionHeaderWithButton}>
//           <View style={styles.sectionHeader}>
//             <Ionicons name="play-circle" size={24} color={'#DC143C'} />
//             <Text style={styles.sectionTitle}>Vidéos Récentes</Text>
//           </View>
//           <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('RecentVideos')}>
//             <Text style={styles.seeMoreText}>Voir plus</Text>
//             <Ionicons name="chevron-forward" size={16} color={'#DC143C'} />
//           </TouchableOpacity>
//         </View>
//         <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {recentVideos.length > 0 ? recentVideos.map((video) => (
//               <TouchableOpacity 
//                 key={video.id || video._id} 
//                 style={styles.videoCard}
//                 onPress={() => navigation.navigate('ShowDetail', { showId: video.id || video._id, isReplay: true })}
//               >
//                 <Image source={{ uri: video.image_url || video.image || 'https://via.placeholder.com/300x200' }} style={styles.videoImage} />
//                 <View style={styles.videoDurationBadge}>
//                   <Text style={styles.videoDuration}>{video.duration || 'N/A'}</Text>
//                 </View>
//                 <View style={styles.videoInfo}>
//                   <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
//                   <Text style={styles.videoDate}>{formatRelativeTime(video.created_at)}</Text>
//                 </View>
//               </TouchableOpacity>
//             )) : (
//               <View style={styles.emptyStateHorizontal}>
//                 <Ionicons name="videocam-outline" size={48} color={'#B0B0B0'} />
//                 <Text style={styles.emptyStateText}>Aucune vidéo récente</Text>
//               </View>
//             )}
//           </ScrollView>
//         </Animated.View>
//       </View>

//       {/* Programmes Populaires */}
//       <View style={[styles.section, { marginBottom: 30 }]}>
//         <View style={styles.sectionHeaderWithButton}>
//           <View style={styles.sectionHeader}>
//             <Ionicons name="star" size={24} color={'#DC143C'} />
//             <Text style={styles.sectionTitle}>Programmes Populaires</Text>
//           </View>
//           <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('PopularPrograms')}>
//             <Text style={styles.seeMoreText}>Voir plus</Text>
//             <Ionicons name="chevron-forward" size={16} color={'#DC143C'} />
//           </TouchableOpacity>
//         </View>
//         <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {popularPrograms.length > 0 ? popularPrograms.map((program) => (
//               <TouchableOpacity 
//                 key={program.id || program._id} 
//                 style={styles.programCard}
//                 onPress={() => navigation.navigate('ShowDetail', { showId: program.id || program._id, isPopularProgram: true })}
//               >
//                 <Image source={{ uri: program.image || program.image_url || 'https://via.placeholder.com/300x200' }} style={styles.programImage} />
//                 <LinearGradient
//                   colors={['transparent', 'rgba(0,0,0,0.85)']}
//                   style={styles.programOverlay}
//                 >
//                   <Text style={styles.programTitle} numberOfLines={1}>{program.title}</Text>
//                   <View style={styles.programSchedule}>
//                     <Ionicons name="time" size={14} color={'#DC143C'} />
//                     <Text style={styles.programScheduleText}>{program.schedule || `${program.episodes || 0} épisodes`}</Text>
//                   </View>
//                 </LinearGradient>
//               </TouchableOpacity>
//             )) : (
//               <View style={styles.emptyStateHorizontal}>
//                 <Ionicons name="star-outline" size={48} color={'#B0B0B0'} />
//                 <Text style={styles.emptyStateText}>Aucun programme populaire</Text>
//               </View>
//             )}
//           </ScrollView>
//         </Animated.View>
//       </View>

//       {/* Interviews */}
//       <View style={[styles.section, { marginBottom: 30 }]}>
//         <View style={styles.sectionHeaderWithButton}>
//           <View style={styles.sectionHeader}>
//             <Ionicons name="mic" size={24} color={'#DC143C'} />
//             <Text style={styles.sectionTitle}>Interviews</Text>
//           </View>
//           <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('Interviews')}>
//             <Text style={styles.seeMoreText}>Voir plus</Text>
//             <Ionicons name="chevron-forward" size={16} color={'#DC143C'} />
//           </TouchableOpacity>
//         </View>
//         <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {interviews.length > 0 ? interviews.map((interview) => (
//               <TouchableOpacity 
//                 key={interview.id || interview._id} 
//                 style={styles.interviewCard}
//                 onPress={() => navigation.navigate('ShowDetail', { showId: interview.id || interview._id, isInterview: true })}
//               >
//                 <Image source={{ uri: interview.image_url || interview.image || 'https://via.placeholder.com/300x200' }} style={styles.interviewImage} />
//                 <LinearGradient
//                   colors={['transparent', 'rgba(0,0,0,0.85)']}
//                   style={styles.interviewOverlay}
//                 >
//                   <View style={styles.interviewBadge}>
//                     <Ionicons name="mic" size={12} color="#fff" />
//                     <Text style={styles.interviewBadgeText}>Interview</Text>
//                   </View>
//                   <Text style={styles.interviewTitle} numberOfLines={2}>{interview.title}</Text>
//                   <Text style={styles.interviewGuest} numberOfLines={1}>{interview.guest || 'Invité'}</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             )) : (
//               <View style={styles.emptyStateHorizontal}>
//                 <Ionicons name="mic-outline" size={48} color={'#B0B0B0'} />
//                 <Text style={styles.emptyStateText}>Aucune interview disponible</Text>
//               </View>
//             )}
//           </ScrollView>
//         </Animated.View>
//       </View>

//       {/* Section Archives Vidéo Premium */}
//       <View style={[styles.section, { marginBottom: 30 }]}>
//         <View style={styles.sectionHeaderWithButton}>
//           <View style={styles.sectionHeader}>
//             <Ionicons name="videocam" size={24} color="#FFD700" />
//             <Text style={styles.sectionTitle}>Archives Vidéo</Text>
//             <View style={styles.premiumBadgeSmall}>
//               <Ionicons name="star" size={12} color="#FFD700" />
//               <Text style={styles.premiumBadgeTextSmall}>Premium</Text>
//             </View>
//           </View>
//           <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('Archive')}>
//             <Text style={styles.seeMoreText}>Voir plus</Text>
//             <Ionicons name="chevron-forward" size={16} color={'#DC143C'} />
//           </TouchableOpacity>
//         </View>
//         <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {archives.length > 0 ? archives.map((archive) => (
//               <TouchableOpacity 
//                 key={archive.id || archive._id} 
//                 style={styles.archiveCard}
//                 onPress={() => navigation.navigate('Archive')}
//               >
//                 <Image 
//                   source={{ uri: archive.image || archive.thumbnail || 'https://via.placeholder.com/300x200' }} 
//                   style={styles.archiveImage} 
//                 />
//                 <LinearGradient
//                   colors={['transparent', 'rgba(0,0,0,0.95)']}
//                   style={styles.archiveOverlay}
//                 >
//                   <View style={styles.archivePremiumBadge}>
//                     <Ionicons name="lock-closed" size={12} color="#FFD700" />
//                     <Text style={styles.archivePremiumText}>Premium</Text>
//                     {archive.price > 0 && (
//                       <Text style={styles.archivePriceText}> • {Math.round(archive.price)} XOF</Text>
//                     )}
//                   </View>
//                   <Text style={styles.archiveTitle} numberOfLines={2}>{archive.title}</Text>
//                   <View style={styles.archiveMeta}>
//                     <Ionicons name="videocam" size={12} color={'#DC143C'} />
//                     <Text style={styles.archiveMetaText}>Vidéo</Text>
//                     {archive.duration_minutes && (
//                       <>
//                         <Text style={styles.archiveMetaSeparator}>•</Text>
//                         <Ionicons name="time" size={12} color={'#B0B0B0'} />
//                         <Text style={styles.archiveMetaText}>{archive.duration_minutes} min</Text>
//                       </>
//                     )}
//                   </View>
//                 </LinearGradient>
//               </TouchableOpacity>
//             )) : (
//               <View style={styles.emptyStateHorizontal}>
//                 <Ionicons name="videocam-outline" size={48} color={'#B0B0B0'} />
//                 <Text style={styles.emptyStateText}>Aucune archive disponible</Text>
//               </View>
//             )}
//           </ScrollView>
//         </Animated.View>
//       </View>

//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000000',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000000',
//   },
//   fullscreenContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   fullscreenVideo: {
//     width: width,
//     height: height,
//   },
//   fullscreenCloseButton: {
//     position: 'absolute',
//     top: 50,
//     right: 20,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 25,
//     padding: 10,
//     zIndex: 1,
//   },
//   liveSection: {
//     marginTop: 0,
//     paddingTop: 20,
//     paddingBottom: 20,
//     backgroundColor: '#000000',
//   },
//   liveSectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingHorizontal: 16,
//   },
//   liveTitleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   liveSectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//     marginLeft: 12,
//   },
//   programmedLiveContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(220, 20, 60, 0.1)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#DC143C',
//   },
//   programmedLiveDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#DC143C',
//     marginRight: 8,
//   },
//   programmedLiveText: {
//     color: '#DC143C',
//     fontSize: 12,
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//   },
//   liveCardFull: {
//     width: width - 32,
//     height: height * 0.45,
//     marginHorizontal: 16,
//     borderRadius: 16,
//     overflow: 'hidden',
//     backgroundColor: '#1A0000',
//   },
//   liveImageFull: {
//     width: '100%',
//     height: '100%',
//   },
//   liveOverlayFull: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 20,
//   },
//   liveBadgeFull: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#DC143C',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//     alignSelf: 'flex-start',
//     marginBottom: 12,
//   },
//   liveIndicatorFull: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: '#FFFFFF',
//     marginRight: 8,
//   },
//   liveTextFull: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   liveTitleFull: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   liveDescriptionFull: {
//     color: '#B0B0B0',
//     fontSize: 12,
//     lineHeight: 20,
//   },
//   liveObjectiveContainer: {
//     marginTop: 8,
//   },
//   liveObjectiveLabel: {
//     color: '#DC143C',
//     fontSize: 12,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   liveTimeText: {
//     color: '#B0B0B0',
//     fontSize: 11,
//     marginTop: 2,
//   },
//   viewersContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 12,
//     gap: 4,
//   },
//   viewersText: {
//     color: '#fff',
//     fontSize: 12,
//   },
//   section: {
//     marginTop: 28,
//     paddingBottom: 8,
//   },
//   sectionHeaderWithButton: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//     paddingHorizontal: 16,
//   },
//   seeMoreButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   seeMoreText: {
//     color: '#DC143C',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//   },
//   newsCard: {
//     width: width * 0.75,
//     height: 180,
//     marginLeft: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//     backgroundColor: '#1A0000',
//   },
//   newsImage: {
//     width: '100%',
//     height: '100%',
//   },
//   newsOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 12,
//   },
//   newsBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#DC143C',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//     alignSelf: 'flex-start',
//     marginBottom: 8,
//     gap: 4,
//   },
//   newsBadgeText: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   newsTitle: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   newsTime: {
//     color: '#B0B0B0',
//     fontSize: 11,
//   },
//   trendingCard: {
//     width: 160,
//     marginLeft: 16,
//     borderRadius: 10,
//     overflow: 'hidden',
//     backgroundColor: '#1A0000',
//   },
//   trendingImage: {
//     width: '100%',
//     height: 120,
//   },
//   trendingInfo: {
//     padding: 10,
//   },
//   trendingTitle: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600',
//     marginBottom: 6,
//   },
//   trendingMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   trendingViews: {
//     color: '#B0B0B0',
//     fontSize: 11,
//   },
//   videoCard: {
//     width: 200,
//     marginLeft: 16,
//     borderRadius: 10,
//     overflow: 'hidden',
//     backgroundColor: '#1A0000',
//   },
//   videoImage: {
//     width: '100%',
//     height: 120,
//   },
//   videoDurationBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     paddingHorizontal: 6,
//     paddingVertical: 3,
//     borderRadius: 4,
//   },
//   videoDuration: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   videoInfo: {
//     padding: 10,
//   },
//   videoTitle: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600',
//     marginBottom: 6,
//   },
//   videoDate: {
//     color: '#B0B0B0',
//     fontSize: 11,
//   },
//   programCard: {
//     width: 180,
//     height: 140,
//     marginLeft: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//     backgroundColor: '#1A0000',
//   },
//   programImage: {
//     width: '100%',
//     height: '100%',
//   },
//   programOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 12,
//   },
//   programTitle: {
//     color: '#FFFFFF',
//     fontSize: 13,
//     fontWeight: 'bold',
//     marginBottom: 6,
//   },
//   programSchedule: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   programScheduleText: {
//     color: '#B0B0B0',
//     fontSize: 11,
//     marginLeft: 4,
//   },
//   interviewCard: {
//     width: 200,
//     height: 160,
//     marginLeft: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//     backgroundColor: '#1A0000',
//   },
//   interviewImage: {
//     width: '100%',
//     height: '100%',
//   },
//   interviewOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 12,
//   },
//   interviewBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#DC143C',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//     alignSelf: 'flex-start',
//     marginBottom: 8,
//     gap: 4,
//   },
//   interviewBadgeText: {
//     color: '#fff',
//     fontSize: 9,
//     fontWeight: 'bold',
//   },
//   interviewTitle: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   interviewGuest: {
//     color: '#B0B0B0',
//     fontSize: 11,
//   },
//   noLiveContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 40,
//     marginHorizontal: 16,
//     marginTop: 10,
//     borderRadius: 16,
//     backgroundColor: '#1A0000',
//   },
//   noLiveText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   noLiveSubtext: {
//     fontSize: 12,
//     color: '#B0B0B0',
//     textAlign: 'center',
//   },
//   emptyStateHorizontal: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//     paddingHorizontal: 20,
//     marginLeft: 16,
//   },
//   emptyStateText: {
//     color: '#B0B0B0',
//     fontSize: 12,
//     marginTop: 12,
//   },
//   premiumBadgeSmall: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 215, 0, 0.15)',
//     alignSelf: 'flex-start',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 10,
//     marginBottom: 8,
//     gap: 4,
//   },
//   premiumBadgeTextSmall: {
//     color: '#FFD700',
//     fontSize: 11,
//     fontWeight: 'bold',
//   },
//   // Styles pour la section Archives
//   archiveCard: {
//     width: width * 0.7,
//     height: 200,
//     marginLeft: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//     backgroundColor: '#1A0000',
//   },
//   archiveImage: {
//     width: '100%',
//     height: '100%',
//   },
//   archiveOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: 12,
//   },
//   archivePremiumBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 215, 0, 0.2)',
//     alignSelf: 'flex-start',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     marginBottom: 8,
//     gap: 4,
//   },
//   archivePremiumText: {
//     color: '#FFD700',
//     fontSize: 11,
//     fontWeight: 'bold',
//   },
//   archivePriceText: {
//     color: '#FFD700',
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   archiveTitle: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginBottom: 6,
//   },
//   archiveMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   archiveMetaText: {
//     color: '#B0B0B0',
//     fontSize: 11,
//   },
//   archiveMetaSeparator: {
//     color: '#B0B0B0',
//     fontSize: 11,
//     marginHorizontal: 4,
//   },
// });