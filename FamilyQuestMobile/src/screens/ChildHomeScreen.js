import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMyChildren } from '../services/childrenService';
import { getMyMessages, sendMessage } from '../services/messageService';
import { createRewardRequest, getRewardRequests, REWARD_REQUEST_STATUSES } from '../services/rewardRequestService';
import { getRewards } from '../services/rewardService';
import { suggestReward } from '../services/rewardSuggestionService';
import { createChatConnection } from '../services/realtimeService';
import { getTasks, TASK_STATUSES, updateTaskStatus } from '../services/taskService';
import { getChildAvatarSource } from '../utils/childAvatars';

const icons = {
  bell: require('../../assets/home-icons/bell.png'),
  chat: require('../../assets/home-icons/chat.png'),
  checkCircle: require('../../assets/home-icons/check-circle.png'),
  chart: require('../../assets/home-icons/chart.png'),
  chevronRight: require('../../assets/home-icons/chevron-right.png'),
  clipboard: require('../../assets/home-icons/clipboard.png'),
  gift: require('../../assets/home-icons/gift.png'),
  home: require('../../assets/home-icons/home.png'),
  medal: require('../../assets/home-icons/medal.png'),
  profile: require('../../assets/home-icons/profile.png'),
  star: require('../../assets/home-icons/star.png'),
  trophy: require('../../assets/home-icons/trophy.png'),
  user: require('../../assets/home-icons/user.png'),
  starGraphic: require('../../assets/child-home/star.png'),
  trophyGraphic: require('../../assets/child-home/trophy.png'),
  profileHelper: require('../../assets/child-home/profile-helper.png'),
  profilePoints: require('../../assets/child-home/profile-points.png'),
  profileReward: require('../../assets/child-home/profile-reward.png'),
  profilePending: require('../../assets/child-home/profile-pending.png'),
  profileCompleted: require('../../assets/child-home/profile-completed.png'),
  profileStatPoints: require('../../assets/child-home/profile-stat-points.png'),
  profileStatReward: require('../../assets/child-home/profile-stat-reward.png'),
};

const ChildFontContext = createContext(false);
const READ_NOTIFICATIONS_STORAGE_PREFIX = 'familyquest:child:read-notifications';

const taskIconSources = {
  dishes: { image: require('../../assets/taskt-item/dishes.png'), color: '#dff4ff' },
  'sort-dishes': { image: require('../../assets/taskt-item/sort-dishes.png'), color: '#e9f8ff' },
  bed: { image: require('../../assets/taskt-item/bed.png'), color: '#efe5ff' },
  laundry: { image: require('../../assets/taskt-item/laundry.png'), color: '#e9f9e6' },
  trash: { image: require('../../assets/taskt-item/trash.png'), color: '#e5f4ff' },
  toys: { image: require('../../assets/taskt-item/toys.png'), color: '#fff1c8' },
  notebook: { image: require('../../assets/taskt-item/notebook.png'), color: '#ffe5d3' },
  book: { image: require('../../assets/taskt-item/book.png'), color: '#e8f2ff' },
  vacum: { image: require('../../assets/taskt-item/vacum.png'), color: '#f0ecff' },
  dust: { image: require('../../assets/taskt-item/dust.png'), color: '#fff0e4' },
  gardening: { image: require('../../assets/taskt-item/gardening.png'), color: '#e7f8d9' },
  trening: { image: require('../../assets/taskt-item/trening.png'), color: '#e6fbf4' },
  task: { image: require('../../assets/taskt-item/task.png'), color: '#edf1ff' },
};

const rewardIconSources = {
  gamepad: { image: require('../../assets/reward-items/gamepad.png'), color: '#eee4ff' },
  'ice-cream': { image: require('../../assets/reward-items/ice-cream.png'), color: '#ffdce8' },
  'travel-car': { image: require('../../assets/reward-items/travel-car.png'), color: '#e7f8d9' },
  picnic: { image: require('../../assets/reward-items/picnic.png'), color: '#fff0ba' },
  'shopping-bag': { image: require('../../assets/reward-items/shopping-bag.png'), color: '#e8f2ff' },
  suitcase: { image: require('../../assets/reward-items/suitcase.png'), color: '#f0ecff' },
};

const rewardIconOptions = [
  { key: 'gamepad', label: 'Igra', source: require('../../assets/reward-items/gamepad.png'), color: '#eee4ff' },
  { key: 'ice-cream', label: 'Sladoled', source: require('../../assets/reward-items/ice-cream.png'), color: '#ffdce8' },
  { key: 'travel-car', label: 'Izlet', source: require('../../assets/reward-items/travel-car.png'), color: '#e7f8d9' },
  { key: 'picnic', label: 'Piknik', source: require('../../assets/reward-items/picnic.png'), color: '#fff0ba' },
  { key: 'shopping-bag', label: 'Kupovina', source: require('../../assets/reward-items/shopping-bag.png'), color: '#e8f2ff' },
  { key: 'suitcase', label: 'Putovanje', source: require('../../assets/reward-items/suitcase.png'), color: '#f0ecff' },
];

const rewardSuggestionTimeOptions = [
  { label: 'Danas', offsetDays: 0 },
  { label: 'Sutra', offsetDays: 1 },
  { label: 'Za 3 dana', offsetDays: 3 },
  { label: 'Za 7 dana', offsetDays: 7 },
];

const tabs = {
  home: 'home',
  profile: 'profile',
  tasks: 'tasks',
  rewards: 'rewards',
};

export function ChildHomeScreen({ token, user, onNavigateHome, onLogout }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(tabs.home);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [familyLinks, setFamilyLinks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [requestingRewardId, setRequestingRewardId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskImage, setSelectedTaskImage] = useState(null);
  const [selectedTaskError, setSelectedTaskError] = useState('');
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSuggestRewardVisible, setIsSuggestRewardVisible] = useState(false);
  const [isMessagesVisible, setIsMessagesVisible] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const loadChildData = async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [loadedTasks, loadedRewards, loadedRewardRequests, loadedFamilyLinks, loadedMessages] = await Promise.all([
        getTasks({ token }),
        getRewards({ token }),
        getRewardRequests({ token }),
        getMyChildren({ token }),
        getMyMessages({ token }),
      ]);

      setTasks(loadedTasks ?? []);
      setRewards(loadedRewards ?? []);
      setRewardRequests(loadedRewardRequests ?? []);
      setFamilyLinks(loadedFamilyLinks ?? []);
      setMessages(loadedMessages ?? []);
    } catch (loadError) {
      setError(loadError.message || 'Učitavanje podataka nije uspjelo.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMessages = async () => {
    if (!token) {
      return;
    }

    try {
      const loadedMessages = await getMyMessages({ token });
      setMessages(loadedMessages ?? []);
    } catch {
    }
  };

  const handleOpenMessages = () => {
    refreshMessages();
    setIsMessagesVisible(true);
  };

  useEffect(() => {
    loadChildData();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const connection = createChatConnection(token);
    let isMounted = true;

    connection.on('MessageReceived', (message) => {
      if (!isMounted) {
        return;
      }

      setMessages((currentMessages) => (
        currentMessages.some((currentMessage) => sameId(currentMessage.id, message.id))
          ? currentMessages
          : [...currentMessages, message]
      ));
    });

    connection.on('RewardRequestUpdated', (rewardRequest) => {
      if (!isMounted) {
        return;
      }

      setRewardRequests((currentRequests) => upsertById(currentRequests, rewardRequest));
    });

    connection.start().catch(() => {});

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    Font.loadAsync({
      FamilyQuestRounded: require('../../assets/fonts/familyquest-rounded.ttf'),
    })
      .then(() => {
        if (isMounted) {
          setIsFontLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsFontLoaded(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const approvedTasks = tasks.filter((task) => isTaskStatus(task.status, TASK_STATUSES.approved, 'Approved'));
    const pendingTasks = tasks.filter((task) => isTaskStatus(task.status, TASK_STATUSES.pendingApproval, 'PendingApproval')).length;
    const assignedTasks = tasks.filter((task) => isTaskStatus(task.status, TASK_STATUSES.assigned, 'Assigned')).length;
    const earnedPoints = approvedTasks.reduce((total, task) => total + getTaskPoints(task), 0);
    const reservedOrSpentPoints = rewardRequests
      .filter((request) => isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.pending, 'Pending')
        || isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.approved, 'Approved'))
      .reduce((total, request) => {
        const reward = rewards.find((currentReward) => sameId(currentReward.id, request.rewardId));
        return total + getRewardPoints(reward);
      }, 0);
    const approvedPoints = Math.max(earnedPoints - reservedOrSpentPoints, 0);
    const progress = tasks.length === 0 ? 0 : Math.round((approvedTasks.length / tasks.length) * 100);
    const affordableRewards = rewards.filter((reward) => reward.isActive !== false && getRewardPoints(reward) <= approvedPoints).length;
    const wonRewards = rewardRequests.filter((request) => isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.approved, 'Approved')).length;

    return {
      approvedPoints,
      approvedTasks: approvedTasks.length,
      assignedTasks,
      pendingTasks,
      progress,
      affordableRewards,
      wonRewards,
      totalTasks: tasks.length,
    };
  }, [rewardRequests, rewards, tasks]);

  const visibleTasks = useMemo(() => {
    const openTasks = tasks.filter((task) => !isTaskStatus(task.status, TASK_STATUSES.approved, 'Approved'));
    const sortedTasks = [...openTasks].sort((firstTask, secondTask) => new Date(firstTask.dueDate) - new Date(secondTask.dueDate));
    return activeTab === tabs.home ? sortedTasks.slice(0, 4) : sortedTasks;
  }, [activeTab, tasks]);

  const visibleRewards = useMemo(() => {
    const activeRewards = rewards.filter((reward) => reward.isActive !== false);
    const rewardsClosestToPoints = [...activeRewards].sort((firstReward, secondReward) => {
      const firstMissingPoints = Math.max(getRewardPoints(firstReward) - stats.approvedPoints, 0);
      const secondMissingPoints = Math.max(getRewardPoints(secondReward) - stats.approvedPoints, 0);

      if (firstMissingPoints !== secondMissingPoints) {
        return firstMissingPoints - secondMissingPoints;
      }

      return getRewardPoints(firstReward) - getRewardPoints(secondReward);
    });

    if (activeTab === tabs.home) {
      return rewardsClosestToPoints.slice(0, 5);
    }

    return [...activeRewards].sort((firstReward, secondReward) => getRewardPoints(firstReward) - getRewardPoints(secondReward));
  }, [activeTab, rewards, stats.approvedPoints]);

  const parentId = familyLinks[0]?.parentId;
  const currentUserId = user?.id ?? user?.userId;
  const readNotificationsStorageKey = `${READ_NOTIFICATIONS_STORAGE_PREFIX}:${currentUserId ?? 'anonymous'}`;

  useEffect(() => {
    let isMounted = true;

    const loadReadNotifications = async () => {
      if (!currentUserId) {
        setReadNotificationIds([]);
        return;
      }

      try {
        const storedIds = await AsyncStorage.getItem(readNotificationsStorageKey);

        if (isMounted) {
          setReadNotificationIds(storedIds ? JSON.parse(storedIds) : []);
        }
      } catch {
        if (isMounted) {
          setReadNotificationIds([]);
        }
      }
    };

    loadReadNotifications();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, readNotificationsStorageKey]);

  const notifications = useMemo(() => {
    const taskNotifications = tasks
      .filter((task) => isTaskStatus(task.status, TASK_STATUSES.rejected, 'Rejected')
        || isTaskStatus(task.status, TASK_STATUSES.pendingApproval, 'PendingApproval'))
      .map((task) => ({
        id: `task-${task.id}`,
        type: 'Zadatak',
        title: isTaskStatus(task.status, TASK_STATUSES.rejected, 'Rejected') ? 'Zadatak je odbijen' : 'Zadatak čeka odobrenje',
        text: isTaskStatus(task.status, TASK_STATUSES.rejected, 'Rejected')
          ? `"${task.name}" možeš ponovo uraditi.`
          : `"${task.name}" je poslan roditelju na pregled.`,
        date: task.submittedAt ?? task.dueDate,
        actionType: 'task',
        payload: task,
      }));

    const rewardNotifications = rewardRequests
      .filter((request) => !isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.pending, 'Pending'))
      .map((request) => {
        const reward = rewards.find((currentReward) => Number(currentReward.id) === Number(request.rewardId));
        const isApproved = isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.approved, 'Approved');

        return {
          id: `reward-request-${request.id}`,
          type: 'Nagrada',
          title: isApproved ? 'Nagrada je odobrena' : 'Nagrada je odbijena',
          text: `"${reward?.name || 'Nagrada'}" ${isApproved ? 'je odobrena.' : 'nije odobrena.'}`,
          date: request.requestDate,
          actionType: 'rewards',
        };
      });

    const messageNotifications = messages
      .filter((message) => Number(message.senderId) !== Number(currentUserId))
      .filter((message) => !isSystemNotificationMessage(message))
      .map((message) => ({
        id: `message-${message.id}`,
        type: 'Poruka',
        title: 'Nova poruka',
        text: message.content,
        date: message.sentAt,
        actionType: 'messages',
      }));

    return [...taskNotifications, ...rewardNotifications, ...messageNotifications]
      .sort((first, second) => new Date(second.date ?? 0) - new Date(first.date ?? 0))
      .slice(0, 20);
  }, [currentUserId, messages, rewardRequests, rewards, tasks]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !readNotificationIds.includes(notification.id)),
    [notifications, readNotificationIds],
  );

  const markNotificationsAsRead = (notificationIds) => {
    setReadNotificationIds((currentIds) => {
      const nextIds = new Set(currentIds);
      notificationIds.forEach((notificationId) => nextIds.add(notificationId));
      const nextIdsArray = [...nextIds];

      AsyncStorage.setItem(readNotificationsStorageKey, JSON.stringify(nextIdsArray)).catch(() => {});

      return nextIdsArray;
    });
  };

  const handleOpenNotifications = () => {
    setIsNotificationsVisible(true);
  };

  const handleNotificationPress = (notification) => {
    markNotificationsAsRead([notification.id]);
    setIsNotificationsVisible(false);

    if (notification.actionType === 'task') {
      handleOpenTask(notification.payload);
      return;
    }

    if (notification.actionType === 'rewards') {
      setActiveTab(tabs.rewards);
      return;
    }

    if (notification.actionType === 'messages') {
      handleOpenMessages();
    }
  };

  const handleSendMessage = async () => {
    const content = messageDraft.trim();

    if (!token || !parentId || !content) {
      return;
    }

    setIsSendingMessage(true);

    try {
      const createdMessage = await sendMessage({ token, receiverId: parentId, content });
      setMessages((currentMessages) => [...currentMessages, createdMessage]);
      setMessageDraft('');
    } catch (messageError) {
      Alert.alert('Greška', messageError.message || 'Slanje poruke nije uspjelo.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setSelectedTaskImage(null);
    setSelectedTaskError('');
  };

  const handlePickTaskImage = async () => {
    setSelectedTaskError('');
    setIsPickingImage(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setSelectedTaskError('Dozvolite pristup slikama kako biste uploadali dokaz zadatka.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        base64: true,
        quality: 0.55,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';

      if (!asset.base64) {
        setSelectedTaskError('Sliku nije moguće učitati. Pokušajte drugu sliku.');
        return;
      }

      setSelectedTaskImage({
        uri: asset.uri,
        dataUrl: `data:${mimeType};base64,${asset.base64}`,
      });
    } catch (pickError) {
      setSelectedTaskError(pickError.message || 'Odabir slike nije uspio.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleCompleteTask = async (task) => {
    if (!selectedTaskImage?.dataUrl) {
      setSelectedTaskError('Prvo odaberite sliku kao dokaz završenog zadatka.');
      return;
    }

    setUpdatingTaskId(task.id);
    setError('');
    setSelectedTaskError('');

    try {
      await updateTaskStatus({
        token,
        taskId: task.id,
        status: TASK_STATUSES.pendingApproval,
        completionImageDataUrl: selectedTaskImage.dataUrl,
      });
      setTasks((currentTasks) => currentTasks.map((currentTask) => (
        currentTask.id === task.id
          ? { ...currentTask, status: TASK_STATUSES.pendingApproval, completionImageDataUrl: selectedTaskImage.dataUrl, submittedAt: new Date().toISOString() }
          : currentTask
      )));
      setSelectedTask(null);
      setSelectedTaskImage(null);
    } catch (updateError) {
      setSelectedTaskError(updateError.message || 'Zadatak nije moguće označiti kao završen.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleRequestReward = async (reward) => {
    setRequestingRewardId(reward.id);
    setError('');

    try {
      const createdRequest = await createRewardRequest({ token, rewardId: reward.id });
      setRewardRequests((currentRequests) => [...currentRequests, createdRequest]);
      Alert.alert('Zahtjev poslan', 'Roditelj sada može odobriti nagradu.');
    } catch (requestError) {
      setError(requestError.message || 'Zahtjev za nagradu nije moguće poslati.');
    } finally {
      setRequestingRewardId(null);
    }
  };

  const handleSuggestReward = async (rewardSuggestion) => {
    if (!token) {
      throw new Error('Morate biti prijavljeni da biste predložili nagradu.');
    }

    await suggestReward({ token, reward: rewardSuggestion });
    Alert.alert('Prijedlog poslan', 'Roditelj je dobio prijedlog nagrade.');
  };

  const level = Math.max(1, Math.floor(stats.approvedPoints / 100) + 1);
  const nextLevelPoints = level * 100;
  const levelProgress = Math.min(100, Math.round((stats.approvedPoints / nextLevelPoints) * 100));
  const pointsToNextLevel = Math.max(nextLevelPoints - stats.approvedPoints, 0);

  return (
    <ChildFontContext.Provider value={isFontLoaded}>
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab !== tabs.profile ? (
            <View style={styles.hero}>
              <View style={styles.cloudOne} />
              <View style={styles.cloudTwo} />
              <View style={styles.sun} />
              <View style={styles.hillBack} />
              <View style={styles.hillFront} />
              <View style={styles.heroHouse}>
                <View style={styles.heroRoof} />
                <View style={styles.heroChimney} />
                <View style={styles.heroDoor} />
                <View style={styles.heroWindow} />
              </View>
              <View style={styles.heroTreeLeft}>
                <View style={styles.treeTop} />
                <View style={styles.treeTrunk} />
              </View>
              <View style={styles.heroTreeRight}>
                <View style={styles.treeTop} />
                <View style={styles.treeTrunk} />
              </View>
              <Pressable style={styles.avatarFrame} onPress={() => setActiveTab(tabs.profile)}>
                <Image source={getChildAvatarSource(user?.avatarKey)} style={styles.avatar} />
              </Pressable>
              <View style={styles.heroTextBox}>
                <ChildText style={styles.greeting}>Zdravo, {getFirstName(user?.name) || 'drugar'}!</ChildText>
                <ChildText style={styles.heroSubtitle}>Spreman si za nove izazove!</ChildText>
              </View>
              <View style={styles.pointsPill}>
                <Graphic source={icons.starGraphic} size={34} />
                <View style={styles.pointsTextBox}>
                  <ChildText style={styles.pointsValue}>{stats.approvedPoints}</ChildText>
                  <ChildText style={styles.pointsLabel}>Moji bodovi</ChildText>
                </View>
              </View>
              <Pressable style={styles.childBellButton} onPress={handleOpenNotifications}>
                <Icon source={icons.bell} size={28} color="#071e60" />
                {unreadNotifications.length > 0 ? (
                  <View style={styles.childBadge}>
                    <ChildText style={styles.childBadgeText}>{unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}</ChildText>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ) : null}

          {activeTab === tabs.home ? (
            <View style={styles.motivationCard}>
              <View style={styles.trophyBubble}>
                <Graphic source={icons.trophyGraphic} size={104} style={styles.trophyGraphic} />
              </View>
              <View style={styles.motivationTextBox}>
                <ChildText style={styles.motivationTitle}>Svaki zadatak</ChildText>
                <ChildText style={styles.motivationLink}>te približava nagradi!</ChildText>
                <ChildText style={styles.motivationSubtitle}>Vjeruj u sebe, možeš ti to!</ChildText>
              </View>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#0065ff" />
              <ChildText style={styles.stateText}>Učitavanje child ekrana...</ChildText>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <ChildText style={styles.errorText}>{error}</ChildText>
              <Pressable style={styles.retryButton} onPress={loadChildData}>
                <ChildText style={styles.retryButtonText}>Pokušaj ponovo</ChildText>
              </Pressable>
            </View>
          ) : null}

          {activeTab === tabs.profile ? (
            <ChildProfileModule user={user} stats={stats} onLogout={onLogout} />
          ) : null}

          {activeTab !== tabs.rewards && activeTab !== tabs.profile ? (
            <Section
              title={activeTab === tabs.home ? 'Moji zadaci' : 'Svi zadaci'}
              icon={icons.clipboard}
              actionLabel={activeTab === tabs.home ? 'Pogledaj sve' : ''}
              onAction={activeTab === tabs.home ? () => setActiveTab(tabs.tasks) : undefined}
            >
              {visibleTasks.length === 0 && !isLoading ? (
                <EmptyState text="Nemaš otvorenih zadataka." />
              ) : (
                visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isUpdating={updatingTaskId === task.id}
                    onOpen={() => handleOpenTask(task)}
                  />
                ))
              )}
            </Section>
          ) : null}

          {activeTab !== tabs.tasks && activeTab !== tabs.profile ? (
            <Section
              title={activeTab === tabs.home ? 'Nagrade' : 'Sve nagrade'}
              icon={icons.gift}
              actionLabel={activeTab === tabs.home ? 'Pogledaj sve' : ''}
              onAction={activeTab === tabs.home ? () => setActiveTab(tabs.rewards) : undefined}
            >
              {visibleRewards.length === 0 && !isLoading ? (
                <EmptyState text="Još nema nagrada za tebe." />
              ) : activeTab === tabs.rewards ? (
                <View style={styles.rewardsList}>
                  {visibleRewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      points={stats.approvedPoints}
                      request={findRewardRequest(rewardRequests, reward.id)}
                      isRequesting={requestingRewardId === reward.id}
                      onRequest={() => handleRequestReward(reward)}
                      variant="list"
                    />
                  ))}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsRow}>
                  {visibleRewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      points={stats.approvedPoints}
                      request={findRewardRequest(rewardRequests, reward.id)}
                      isRequesting={requestingRewardId === reward.id}
                      onRequest={() => handleRequestReward(reward)}
                    />
                  ))}
                </ScrollView>
              )}
              {activeTab === tabs.rewards ? (
                <Pressable style={styles.suggestRewardButton} onPress={() => setIsSuggestRewardVisible(true)}>
                  <Icon source={icons.gift} size={24} color="#0ca85d" />
                  <ChildText style={styles.suggestRewardButtonText}>Predloži nagradu</ChildText>
                </Pressable>
              ) : null}
            </Section>
          ) : null}

          {activeTab === tabs.home ? (
            <>
              <View style={styles.progressCard}>
                <View style={styles.progressIconBox}>
                  <Icon source={icons.chart} size={34} color="#8b5cf6" />
                </View>
                <View style={styles.progressCopy}>
                  <ChildText style={styles.progressTitle}>Moj napredak</ChildText>
                  <ChildText style={styles.progressText}>Bravo! Nastavi tako!</ChildText>
                </View>
                <View style={styles.levelBadge}>
                  <ChildText style={styles.levelSmall}>Level</ChildText>
                  <ChildText style={styles.levelValue}>{level}</ChildText>
                </View>
                <View style={styles.levelProgressBox}>
                  <ChildText style={styles.levelHint}>Još {pointsToNextLevel} bodova do nivoa {level + 1}</ChildText>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
                  </View>
                  <ChildText style={styles.levelScore}>{stats.approvedPoints} / {nextLevelPoints}</ChildText>
                </View>
              </View>

              <View style={styles.encouragementCard}>
                <Graphic source={icons.starGraphic} size={50} />
                <View style={styles.encouragementTextBox}>
                  <ChildText style={styles.encouragementTitle}>Ti si super!</ChildText>
                  <ChildText style={styles.encouragementSubtitle}>Ponosan/na smo na tebe!</ChildText>
                </View>
                <View style={styles.dailyGoalPill}>
                  <Icon source={icons.checkCircle} size={27} color="#ffffff" />
                  <View>
                    <ChildText style={styles.dailyGoalTitle}>Dnevni cilj</ChildText>
                    <ChildText style={styles.dailyGoalText}>{stats.approvedTasks} / {Math.max(stats.totalTasks, 1)} završena</ChildText>
                  </View>
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>

        <ChildTaskSubmitModal
          task={selectedTask}
          image={selectedTaskImage}
          errorMessage={selectedTaskError}
          isPickingImage={isPickingImage}
          isSubmitting={selectedTask ? updatingTaskId === selectedTask.id : false}
          onClose={() => {
            setSelectedTask(null);
            setSelectedTaskImage(null);
            setSelectedTaskError('');
          }}
          onPickImage={handlePickTaskImage}
          onSubmit={() => selectedTask ? handleCompleteTask(selectedTask) : null}
        />
        <SuggestRewardModal
          visible={isSuggestRewardVisible}
          onClose={() => setIsSuggestRewardVisible(false)}
          onSubmit={handleSuggestReward}
        />
        <ChildMessagesModal
          visible={isMessagesVisible}
          currentUser={user}
          parentId={parentId}
          messages={messages}
          draft={messageDraft}
          isSending={isSendingMessage}
          onDraftChange={setMessageDraft}
          onSend={handleSendMessage}
          onClose={() => setIsMessagesVisible(false)}
        />
        <ChildNotificationsModal
          visible={isNotificationsVisible}
          notifications={notifications}
          readNotificationIds={readNotificationIds}
          onClose={() => setIsNotificationsVisible(false)}
          onNotificationPress={handleNotificationPress}
        />
        <BottomNavigation
          bottomInset={insets.bottom}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onNavigateHome={onNavigateHome}
          onNavigateMessages={handleOpenMessages}
        />
      </View>
    </SafeAreaView>
    </ChildFontContext.Provider>
  );
}

function Section({ title, icon, actionLabel, onAction, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          {icon ? <Icon source={icon} size={27} color="#0c7593" /> : null}
          <ChildText style={styles.sectionTitle}>{title}</ChildText>
        </View>
        {actionLabel ? (
          <Pressable style={styles.sectionAction} onPress={onAction}>
            <ChildText style={styles.sectionActionText}>{actionLabel}</ChildText>
            <Icon source={icons.chevronRight} size={18} color="#0065ff" />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function TaskCard({ task, isUpdating, onOpen }) {
  const taskIcon = taskIconSources[task.iconKey ?? task.taskIcon] ?? taskIconSources.notebook;
  const status = getTaskStatusView(task.status);

  return (
    <Pressable style={styles.taskCard} onPress={onOpen}>
      <View style={[styles.taskIconBox, { backgroundColor: taskIcon.color }]}>
        <Image source={taskIcon.image} style={styles.taskIcon} resizeMode="contain" />
      </View>
      <View style={styles.taskInfo}>
        <ChildText style={styles.taskName}>{task.name}</ChildText>
        <ChildText style={styles.taskMeta}>{getTaskPoints(task)} bodova - Rok: {formatShortDate(task.dueDate)}</ChildText>
      </View>
      <View style={[styles.statusPill, { backgroundColor: status.backgroundColor }]}>
        <ChildText style={[styles.statusText, { color: status.color }]}>{status.label}</ChildText>
        {isUpdating ? <ActivityIndicator color={status.color} size="small" /> : <Icon source={status.icon} size={22} color={status.color} />}
      </View>
    </Pressable>
  );
}

function ChildTaskSubmitModal({ task, image, errorMessage, isPickingImage, isSubmitting, onClose, onPickImage, onSubmit }) {
  if (!task) {
    return null;
  }

  const taskIcon = taskIconSources[task.iconKey ?? task.taskIcon] ?? taskIconSources.notebook;
  const canSubmit = isTaskStatus(task.status, TASK_STATUSES.assigned, 'Assigned')
    || isTaskStatus(task.status, TASK_STATUSES.rejected, 'Rejected');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.submitModalCard}>
          <View style={styles.modalHeaderRow}>
            <ChildText style={styles.modalTitle}>Završi zadatak</ChildText>
            <Pressable onPress={onClose} hitSlop={10} disabled={isSubmitting}>
              <ChildText style={styles.modalClose}>x</ChildText>
            </Pressable>
          </View>

          <View style={styles.submitTaskRow}>
            <View style={[styles.taskIconBox, { backgroundColor: taskIcon.color }]}>
              <Image source={taskIcon.image} style={styles.taskIcon} resizeMode="contain" />
            </View>
            <View style={styles.taskInfo}>
              <ChildText style={styles.taskName}>{task.name}</ChildText>
              <ChildText style={styles.taskMeta}>{getTaskPoints(task)} bodova - Rok: {formatShortDate(task.dueDate)}</ChildText>
            </View>
          </View>

          {task.completionImageDataUrl ? (
            <View style={styles.existingImageBox}>
              <ChildText style={styles.evidenceLabel}>Poslana slika</ChildText>
              <Image source={{ uri: task.completionImageDataUrl }} style={styles.evidenceImage} resizeMode="cover" />
            </View>
          ) : null}

          {canSubmit ? (
            <>
              <Pressable style={styles.pickImageButton} onPress={onPickImage} disabled={isPickingImage || isSubmitting}>
                {isPickingImage ? <ActivityIndicator color="#0065ff" /> : <ChildText style={styles.pickImageButtonText}>{image ? 'Promijeni sliku' : 'Odaberi sliku'}</ChildText>}
              </Pressable>

              {image ? (
                <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <ChildText style={styles.previewPlaceholderText}>Slika zadatka će se prikazati ovdje.</ChildText>
                </View>
              )}

              {errorMessage ? <ChildText style={styles.submitErrorText}>{errorMessage}</ChildText> : null}

              <View style={styles.submitActionsRow}>
                <Pressable style={[styles.cancelSubmitButton, isSubmitting && styles.disabledButton]} onPress={onClose} disabled={isSubmitting}>
                  <ChildText style={styles.cancelSubmitButtonText}>Odustani</ChildText>
                </Pressable>
                <Pressable style={[styles.submitDoneButton, isSubmitting && styles.disabledButton]} onPress={onSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <ChildText style={styles.submitDoneButtonText}>Završi</ChildText>}
                </Pressable>
              </View>
            </>
          ) : (
            <ChildText style={styles.modalHint}>Ovaj zadatak je već poslan ili zaključen.</ChildText>
          )}
        </View>
      </View>
    </Modal>
  );
}

function SuggestRewardModal({ visible, onClose, onSubmit }) {
  const [rewardName, setRewardName] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(rewardIconOptions[0]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setRewardName('');
    setSelectedTime(null);
    setSelectedIcon(rewardIconOptions[0]);
    setErrorMessage('');
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedName = rewardName.trim();

    if (!trimmedName) {
      setErrorMessage('Unesite naziv nagrade.');
      return;
    }

    if (trimmedName.length > 50) {
      setErrorMessage('Naziv nagrade moze imati najvise 50 karaktera.');
      return;
    }

    if (!selectedTime) {
      setErrorMessage('Odaberite period ostvarenja.');
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + selectedTime.offsetDays);

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        name: trimmedName,
        dueDate: dueDate.toISOString(),
        iconKey: selectedIcon.key,
      });

      resetForm();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'Slanje prijedloga nagrade nije uspjelo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.suggestModalCard}>
          <View style={styles.modalHeaderRow}>
            <ChildText style={styles.modalTitle}>Predloži nagradu</ChildText>
            <Pressable onPress={handleClose} hitSlop={10} disabled={isSubmitting}>
              <ChildText style={styles.modalClose}>x</ChildText>
            </Pressable>
          </View>

          <ChildText style={styles.suggestInputLabel}>Naziv nagrade</ChildText>
          <TextInput
            style={styles.suggestInput}
            value={rewardName}
            editable={!isSubmitting}
            onChangeText={(value) => {
              if (value.length <= 50) {
                setRewardName(value);
              }
            }}
            placeholder="Npr. Sladoled, park, igrica..."
            placeholderTextColor="#9aa6bd"
          />

          <ChildText style={styles.suggestInputLabel}>Period ostvarenja</ChildText>
          <View style={styles.suggestTimeRow}>
            {rewardSuggestionTimeOptions.map((option) => {
              const isSelected = selectedTime?.label === option.label;
              return (
                <Pressable
                  key={option.label}
                  style={[styles.suggestTimeOption, isSelected && styles.suggestTimeOptionSelected]}
                  onPress={() => setSelectedTime(option)}
                  disabled={isSubmitting}
                >
                  <ChildText style={[styles.suggestTimeText, isSelected && styles.suggestTimeTextSelected]}>{option.label}</ChildText>
                </Pressable>
              );
            })}
          </View>

          <ChildText style={styles.suggestInputLabel}>Ikonica nagrade</ChildText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestIconRow}>
            {rewardIconOptions.map((option) => {
              const isSelected = selectedIcon.key === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.suggestIconOption, isSelected && styles.suggestIconOptionSelected]}
                  onPress={() => setSelectedIcon(option)}
                  disabled={isSubmitting}
                >
                  <View style={[styles.suggestIconBox, { backgroundColor: option.color }]}>
                    <Image source={option.source} style={styles.suggestIconImage} resizeMode="contain" />
                  </View>
                  <ChildText style={[styles.suggestIconLabel, isSelected && styles.suggestIconLabelSelected]}>{option.label}</ChildText>
                </Pressable>
              );
            })}
          </ScrollView>

          {errorMessage ? <ChildText style={styles.submitErrorText}>{errorMessage}</ChildText> : null}

          <View style={styles.submitActionsRow}>
            <Pressable style={[styles.cancelSubmitButton, isSubmitting && styles.disabledButton]} onPress={handleClose} disabled={isSubmitting}>
              <ChildText style={styles.cancelSubmitButtonText}>Odustani</ChildText>
            </Pressable>
            <Pressable style={[styles.submitDoneButton, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <ChildText style={styles.submitDoneButtonText}>Pošalji</ChildText>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RewardCard({ reward, points, request, isRequesting, onRequest, variant = 'card' }) {
  const rewardIcon = rewardIconSources[reward.iconKey ?? reward.rewardIcon] ?? rewardIconSources.gamepad;
  const requiredPoints = getRewardPoints(reward);
  const missingPoints = Math.max(requiredPoints - points, 0);
  const canRequest = missingPoints === 0 && !request;
  const requestLabel = getRewardRequestLabel(request);
  const isList = variant === 'list';

  return (
    <View style={[styles.rewardCard, isList && styles.rewardCardList]}>
      <View style={[styles.rewardIconBox, isList && styles.rewardIconBoxList, { backgroundColor: rewardIcon.color }]}>
        <Image source={rewardIcon.image} style={[styles.rewardIcon, isList && styles.rewardIconList]} resizeMode="contain" />
      </View>
      <View style={isList && styles.rewardListInfo}>
        <ChildText style={[styles.rewardName, isList && styles.rewardNameList]}>{reward.name}</ChildText>
        <ChildText style={[styles.rewardPoints, isList && styles.rewardPointsList]}>{requiredPoints} bodova</ChildText>
        {requestLabel ? <ChildText style={styles.rewardRequestText}>{requestLabel}</ChildText> : null}
        {!requestLabel && missingPoints > 0 ? <ChildText style={styles.rewardLockedText}>Još {missingPoints} bodova</ChildText> : null}
      </View>
      {canRequest ? (
        <Pressable style={[styles.rewardButton, isList && styles.rewardButtonList]} onPress={onRequest} disabled={isRequesting}>
          {isRequesting ? <ActivityIndicator color="#ffffff" size="small" /> : <ChildText style={styles.rewardButtonText}>Zatraži</ChildText>}
        </Pressable>
      ) : null}
    </View>
  );
}

function MiniStat({ icon, value, label, color }) {
  return (
    <View style={styles.miniStat}>
      <Icon source={icon} size={25} color={color} />
      <ChildText style={styles.miniStatValue}>{value}</ChildText>
      <ChildText style={styles.miniStatLabel}>{label}</ChildText>
    </View>
  );
}

function EmptyState({ text }) {
  return (
    <View style={styles.emptyState}>
      <ChildText style={styles.emptyText}>{text}</ChildText>
    </View>
  );
}

function ChildProfileModule({ user, stats, onLogout }) {
  const level = Math.max(1, Math.floor(stats.approvedPoints / 100) + 1);
  const nextLevelPoints = level * 100;
  const levelProgress = Math.min(100, Math.round((stats.approvedPoints / nextLevelPoints) * 100));
  const pointsToNextLevel = Math.max(nextLevelPoints - stats.approvedPoints, 0);
  const medals = [
    { key: 'helper', image: icons.profileHelper, title: 'Super pomagač', description: 'Završi 5 zadataka', achieved: stats.approvedTasks >= 5 },
    { key: 'points', image: icons.profilePoints, title: 'Lovac na bodove', description: 'Osvoji 100 bodova', achieved: stats.approvedPoints >= 100 },
    { key: 'reward', image: icons.profileReward, title: 'Lovac na nagrade', description: 'Osvoji prvu nagradu', achieved: stats.wonRewards >= 1 },
  ];

  return (
    <View style={styles.profileModule}>
      <View style={styles.profileHeaderCard}>
        <View style={styles.profileCloudOne} />
        <View style={styles.profileCloudTwo} />
        <View style={styles.profileSun} />
        <View style={styles.profileHillBack} />
        <View style={styles.profileHillFront} />
        <View style={styles.profileHouse}>
          <View style={styles.profileRoof} />
          <View style={styles.profileChimney} />
          <View style={styles.profileDoor} />
          <View style={styles.profileWindow} />
        </View>
        <Image source={getChildAvatarSource(user?.avatarKey)} style={styles.profileAvatar} />
        <ChildText style={styles.profileName}>{user?.name || 'Dijete'}</ChildText>
        <ChildText style={styles.profileSubtitle}>Moj FamilyQuest profil</ChildText>
      </View>

      <View style={styles.profileStatsGrid}>
        <ProfileStatCard image={icons.profilePending} value={stats.pendingTasks} label="Zadataka na čekanju" />
        <ProfileStatCard image={icons.profileCompleted} value={stats.approvedTasks} label="Ukupno završenih zadataka" />
        <ProfileStatCard image={icons.profileStatReward} value={stats.wonRewards} label="Osvojenih nagrada" />
        <ProfileStatCard image={icons.profileStatPoints} value={stats.approvedPoints} label="Osvojenih bodova" />
      </View>

      <View style={styles.profileLevelCard}>
        <View style={styles.profileLevelBadge}>
          <ChildText style={styles.profileLevelBadgeText}>Level</ChildText>
          <ChildText style={styles.profileLevelNumber}>{level}</ChildText>
        </View>
        <View style={styles.profileLevelInfo}>
          <ChildText style={styles.profileSectionTitle}>Moj level</ChildText>
          <ChildText style={styles.profileLevelHint}>Još {pointsToNextLevel} bodova do nivoa {level + 1}</ChildText>
          <View style={styles.profileLevelTrack}>
            <View style={[styles.profileLevelFill, { width: `${levelProgress}%` }]} />
          </View>
          <ChildText style={styles.profileLevelScore}>{stats.approvedPoints} / {nextLevelPoints} bodova</ChildText>
        </View>
      </View>

      <View style={styles.profileMedalsCard}>
        <ChildText style={styles.profileSectionTitle}>Moje medalje</ChildText>
        <View style={styles.profileMedalsRow}>
          {medals.map((medal) => (
            <View key={medal.key} style={[styles.profileMedalItem, !medal.achieved && styles.profileMedalLocked]}>
              <View style={[styles.profileMedalIconBox, !medal.achieved && styles.profileMedalIconBoxLocked]}>
                <Image source={medal.image} style={[styles.profileMedalImage, !medal.achieved && styles.profileMedalImageLocked]} resizeMode="contain" />
              </View>
              <ChildText style={[styles.profileMedalTitle, !medal.achieved && styles.profileMedalTitleLocked]}>{medal.title}</ChildText>
              <ChildText style={styles.profileMedalDescription}>{medal.achieved ? 'Osvojeno' : medal.description}</ChildText>
            </View>
          ))}
        </View>
      </View>

      <Pressable style={styles.childLogoutButton} onPress={onLogout}>
        <ChildText style={styles.childLogoutButtonText}>Odjavi se</ChildText>
      </Pressable>
    </View>
  );
}

function ProfileStatCard({ image, value, label }) {
  return (
    <View style={styles.profileStatCard}>
      <View style={styles.profileStatIconBox}>
        <Image source={image} style={styles.profileStatImage} resizeMode="contain" />
      </View>
      <ChildText style={styles.profileStatValue}>{value}</ChildText>
      <ChildText style={styles.profileStatLabel}>{label}</ChildText>
    </View>
  );
}

function ChildMessagesModal({ visible, currentUser, parentId, messages, draft, isSending, onDraftChange, onSend, onClose }) {
  const chatScrollRef = useRef(null);
  const currentUserId = currentUser?.id ?? currentUser?.userId;
  const conversationMessages = messages
    .filter((message) => isConversationMessage(message, currentUserId, parentId))
    .filter((message) => !isSystemNotificationMessage(message))
    .sort((first, second) => new Date(first.sentAt) - new Date(second.sentAt));

  useEffect(() => {
    if (visible && parentId) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [visible, parentId, conversationMessages.length]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.childMessagesModalCard}>
          <View style={styles.modalHeaderRow}>
            <ChildText style={styles.modalTitle}>Poruke</ChildText>
            <Pressable onPress={onClose} hitSlop={10} disabled={isSending}>
              <ChildText style={styles.modalClose}>×</ChildText>
            </Pressable>
          </View>

          {!parentId ? (
            <View style={styles.chatEmptyBox}>
              <ChildText style={styles.emptyText}>Nije pronađen povezani roditelj za slanje poruka.</ChildText>
            </View>
          ) : (
            <>
              <ChildText style={styles.chatSubtitle}>Razgovor sa roditeljem</ChildText>
              <ScrollView
                ref={chatScrollRef}
                style={styles.chatMessagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              >
                {conversationMessages.length === 0 ? (
                  <View style={styles.chatEmptyBox}>
                    <ChildText style={styles.emptyText}>Još nema poruka. Pošalji prvu poruku!</ChildText>
                  </View>
                ) : (
                  conversationMessages.map((message) => {
                    const isMine = sameId(message.senderId, currentUserId);

                    return (
                      <View key={message.id} style={[styles.chatBubble, isMine ? styles.chatBubbleMine : styles.chatBubbleTheirs]}>
                        <ChildText style={[styles.chatBubbleText, isMine && styles.chatBubbleTextMine]}>{message.content}</ChildText>
                        <ChildText style={[styles.chatBubbleTime, isMine && styles.chatBubbleTimeMine]}>{formatMessageTime(message.sentAt)}</ChildText>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  value={draft}
                  onChangeText={onDraftChange}
                  placeholder="Napiši poruku..."
                  multiline
                  editable={!isSending}
                />
                <Pressable style={[styles.chatSendButton, isSending && styles.disabledButton]} onPress={onSend} disabled={isSending || !draft.trim()}>
                  {isSending ? <ActivityIndicator color="#ffffff" /> : <Icon source={icons.chat} size={22} color="#ffffff" />}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ChildNotificationsModal({ visible, notifications, readNotificationIds, onClose, onNotificationPress }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.childNotificationsModalCard}>
          <View style={styles.modalHeaderRow}>
            <ChildText style={styles.modalTitle}>Notifikacije</ChildText>
            <Pressable onPress={onClose} hitSlop={10}>
              <ChildText style={styles.modalClose}>×</ChildText>
            </Pressable>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.chatEmptyBox}>
              <ChildText style={styles.emptyText}>Trenutno nema novih notifikacija.</ChildText>
            </View>
          ) : (
            <ScrollView style={styles.childNotificationsList} showsVerticalScrollIndicator={false}>
              {notifications.map((notification) => {
                const isRead = readNotificationIds.includes(notification.id);

                return (
                  <Pressable
                    key={notification.id}
                    style={[styles.childNotificationRow, isRead && styles.childNotificationRowRead]}
                    onPress={() => onNotificationPress?.(notification)}
                  >
                    <View style={[styles.childNotificationTypePill, isRead && styles.childNotificationTypePillRead]}>
                      <ChildText style={styles.childNotificationTypeText}>{notification.type}</ChildText>
                    </View>
                    <View style={styles.childNotificationBody}>
                      <ChildText style={[styles.childNotificationTitle, isRead && styles.childNotificationTitleRead]}>{notification.title}</ChildText>
                      <ChildText style={styles.childNotificationText}>{notification.text}</ChildText>
                      <ChildText style={styles.childNotificationTime}>{formatMessageTime(notification.date)}</ChildText>
                    </View>
                    <Icon source={icons.chevronRight} size={18} color={isRead ? '#b7c0d0' : '#8790a7'} />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function BottomNavigation({ bottomInset, activeTab, onChangeTab, onNavigateHome, onNavigateMessages }) {
  const items = [
    { label: 'Početna', icon: icons.home, tab: tabs.home, onPress: onNavigateHome },
    { label: 'Zadaci', icon: icons.user, tab: tabs.tasks },
    { label: 'Nagrade', icon: icons.gift, tab: tabs.rewards },
    { label: 'Poruke', icon: icons.chat, onPress: onNavigateMessages },
    { label: 'Profil', icon: icons.profile, tab: tabs.profile },
  ];

  return (
    <View style={[styles.bottomNav, { bottom: Math.max(bottomInset + 8, 14) }]}>
      {items.map((item) => {
        const isActive = item.tab ? activeTab === item.tab : false;

        return (
          <Pressable
            key={item.label}
            style={styles.navItem}
            onPress={() => {
              if (item.tab) {
                onChangeTab(item.tab);
              }
              item.onPress?.();
            }}
          >
            <Icon source={item.icon} size={28} color={isActive ? '#0065ff' : '#46536c'} />
            <ChildText style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</ChildText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Icon({ source, size, color }) {
  return <Image source={source} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />;
}

function Graphic({ source, size, style }) {
  return <Image source={source} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}

function ChildText({ style, ...props }) {
  const isFontLoaded = useContext(ChildFontContext);
  return <Text {...props} style={[isFontLoaded && styles.childFont, style]} />;
}

function isTaskStatus(status, numericValue, textValue) {
  return Number(status) === numericValue || status === textValue;
}

function upsertById(items, nextItem) {
  if (!nextItem?.id) {
    return items;
  }

  if (items.some((item) => sameId(item.id, nextItem.id))) {
    return items.map((item) => (sameId(item.id, nextItem.id) ? nextItem : item));
  }

  return [...items, nextItem];
}

function isRewardRequestStatus(status, numericValue, textValue) {
  return Number(status) === numericValue || status === textValue;
}

function getTaskStatusView(status) {
  if (isTaskStatus(status, TASK_STATUSES.approved, 'Approved')) {
    return { label: 'Završeno', color: '#0a9d57', backgroundColor: '#e8f8ef', icon: icons.checkCircle };
  }

  if (isTaskStatus(status, TASK_STATUSES.pendingApproval, 'PendingApproval')) {
    return { label: 'Čeka odobrenje', color: '#c77a00', backgroundColor: '#fff4dc', icon: icons.bell };
  }

  if (isTaskStatus(status, TASK_STATUSES.rejected, 'Rejected')) {
    return { label: 'Otkazano', color: '#d33b3b', backgroundColor: '#fff0f0', icon: icons.bell };
  }

  return { label: 'Dodijeljeno', color: '#0065ff', backgroundColor: '#e8f2ff', icon: icons.bell };
}

function getRewardRequestLabel(request) {
  if (!request) {
    return '';
  }

  if (isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.approved, 'Approved')) {
    return 'Odobrena';
  }

  if (isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.rejected, 'Rejected')) {
    return 'Odbijena';
  }

  return 'Ceka odobrenje';
}

function findRewardRequest(requests, rewardId) {
  return requests.find((request) => Number(request.rewardId) === Number(rewardId)
    && !isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.rejected, 'Rejected'));
}

function getFirstName(name) {
  return name?.split(' ')?.[0];
}

function getTaskPoints(task) {
  return Number(task?.points) || 0;
}

function getRewardPoints(reward) {
  return Number(reward?.requiredPoints ?? reward?.points) || 0;
}

function sameId(firstId, secondId) {
  return firstId != null && secondId != null && Number(firstId) === Number(secondId);
}

function isConversationMessage(message, firstUserId, secondUserId) {
  return (sameId(message.senderId, firstUserId) && sameId(message.receiverId, secondUserId))
    || (sameId(message.senderId, secondUserId) && sameId(message.receiverId, firstUserId));
}

function isSystemNotificationMessage(message) {
  const content = message?.content?.toLowerCase() ?? '';
  return content.includes('je poslao/la zadatak')
    || content.includes('predlaze nagradu')
    || content.includes('predlaže nagradu')
    || content.includes('prijedlog nagrade')
    || content.includes('zahtjev za nagradu')
    || content.includes('zatražio/la')
    || content.includes('zatrazilo')
    || content.includes('zatražilo');
}

function formatMessageTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit' });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#94e4ff' },
  childFont: { fontFamily: 'FamilyQuestRounded' },
  screen: { flex: 1, backgroundColor: '#f7fbff' },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 116 },
  hero: { minHeight: 260, marginHorizontal: -14, marginTop: -12, paddingHorizontal: 22, paddingTop: 30, flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#80ddff', overflow: 'hidden' },
  cloudOne: { position: 'absolute', right: 34, top: 60, width: 96, height: 42, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.7)' },
  cloudTwo: { position: 'absolute', left: -28, top: 130, width: 100, height: 48, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.52)' },
  sun: { position: 'absolute', right: 106, top: 138, width: 45, height: 45, borderRadius: 23, backgroundColor: '#ffd54d' },
  hillBack: { position: 'absolute', left: -60, right: -40, bottom: -72, height: 150, borderTopLeftRadius: 190, borderTopRightRadius: 190, backgroundColor: '#bdf36f' },
  hillFront: { position: 'absolute', right: -40, bottom: -96, width: 270, height: 175, borderTopLeftRadius: 180, backgroundColor: '#6ed13a' },
  heroHouse: { position: 'absolute', right: 58, bottom: 28, width: 58, height: 43, borderRadius: 7, backgroundColor: '#ffd46a', borderWidth: 1, borderColor: '#efad3a' },
  heroRoof: { position: 'absolute', left: -7, top: -20, width: 72, height: 28, borderRadius: 5, backgroundColor: '#f26b24', transform: [{ rotate: '-8deg' }] },
  heroChimney: { position: 'absolute', right: 9, top: -25, width: 9, height: 20, borderRadius: 3, backgroundColor: '#c94d1a' },
  heroDoor: { position: 'absolute', left: 23, bottom: 0, width: 14, height: 23, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: '#9f6b3d' },
  heroWindow: { position: 'absolute', right: 7, top: 14, width: 12, height: 12, borderRadius: 3, backgroundColor: '#a8e8ff', borderWidth: 1, borderColor: '#ffffff' },
  heroTreeLeft: { position: 'absolute', right: 125, bottom: 35, width: 34, height: 72, alignItems: 'center', justifyContent: 'flex-end' },
  heroTreeRight: { position: 'absolute', right: 13, bottom: 39, width: 39, height: 80, alignItems: 'center', justifyContent: 'flex-end' },
  treeTop: { position: 'absolute', top: 0, width: 34, height: 44, borderRadius: 18, backgroundColor: '#65c72f' },
  treeTrunk: { width: 8, height: 45, borderRadius: 4, backgroundColor: '#9b693f' },
  avatarFrame: { width: 98, height: 98, borderRadius: 49, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#0d3d73', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.13, shadowRadius: 16, elevation: 6 },
  avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#ffe087' },
  heroTextBox: { flex: 1, paddingHorizontal: 14, paddingTop: 22 },
  greeting: { color: '#071e60', fontSize: 26, lineHeight: 31, fontWeight: '900' },
  heroSubtitle: { color: '#34456e', fontSize: 15, lineHeight: 21, fontWeight: '800', marginTop: 7 },
  pointsPill: { width: 104, minHeight: 74, borderRadius: 24, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 7, marginTop: 18, shadowColor: '#0d3d73', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 15, elevation: 5 },
  pointsTextBox: { alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  pointsValue: { color: '#071e60', fontSize: 23, lineHeight: 27, fontWeight: '900', textAlign: 'center' },
  pointsLabel: { color: '#34456e', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  childBellButton: { position: 'absolute', right: 22, top: 138, width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#0d3d73', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 5 },
  childBadge: { position: 'absolute', right: -3, top: -4, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#ff3d32', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  childBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  motivationCard: { minHeight: 112, borderRadius: 28, backgroundColor: 'rgba(224, 249, 255, 0.9)', marginTop: -76, marginHorizontal: 18, marginBottom: 12, padding: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#0d3d73', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  trophyBubble: { width: 112, height: 84, borderRadius: 24, backgroundColor: '#d8f5ff', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'visible' },
  trophyGraphic: { marginTop: -8 },
  motivationTextBox: { flex: 1 },
  motivationTitle: { color: '#071e60', fontSize: 18, fontWeight: '900' },
  motivationLink: { color: '#0c7593', fontSize: 18, fontWeight: '900', textDecorationLine: 'underline', marginTop: 3 },
  motivationSubtitle: { color: '#071e60', fontSize: 13, fontWeight: '800', marginTop: 10 },
  progressCard: { minHeight: 116, borderRadius: 22, padding: 14, marginTop: 18, marginBottom: 16, backgroundColor: '#f1eaff', flexDirection: 'row', alignItems: 'center', shadowColor: '#7a61c7', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 4 },
  progressIconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  progressCopy: { width: 92, marginRight: 8 },
  progressTitle: { color: '#071e60', fontSize: 17, fontWeight: '900' },
  progressText: { color: '#071e60', fontSize: 13, fontWeight: '800', marginTop: 7 },
  levelBadge: { width: 48, height: 56, borderRadius: 16, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  levelSmall: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  levelValue: { color: '#ffffff', fontSize: 24, fontWeight: '900', lineHeight: 27 },
  levelProgressBox: { flex: 1 },
  levelHint: { color: '#34456e', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  progressTrack: { height: 12, borderRadius: 8, backgroundColor: '#ffffff', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8, backgroundColor: '#3fdd13' },
  levelScore: { color: '#071e60', fontSize: 13, fontWeight: '900', marginTop: 7 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  miniStat: { flex: 1, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 15, alignItems: 'center', paddingVertical: 12, backgroundColor: '#ffffff' },
  miniStatValue: { color: '#071e60', fontSize: 20, fontWeight: '900', marginTop: 4 },
  miniStatLabel: { color: '#52607b', fontSize: 12, fontWeight: '800', marginTop: 2 },
  stateBox: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 14 },
  stateText: { color: '#52607b', fontSize: 14, fontWeight: '700', marginTop: 8 },
  errorBox: { borderRadius: 14, backgroundColor: '#fff1f0', padding: 14, marginBottom: 14, alignItems: 'center' },
  errorText: { color: '#b42318', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 19 },
  retryButton: { marginTop: 10, borderRadius: 10, backgroundColor: '#b42318', paddingHorizontal: 14, paddingVertical: 9 },
  retryButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  section: { borderRadius: 26, backgroundColor: '#ffffff', padding: 16, marginTop: 12, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  sectionHeader: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { color: '#071e60', fontSize: 22, fontWeight: '900' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionActionText: { color: '#0065ff', fontSize: 14, fontWeight: '900' },
  taskCard: { minHeight: 86, borderBottomWidth: 1, borderBottomColor: '#e7edf6', paddingVertical: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' },
  taskIconBox: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  taskIcon: { width: 40, height: 40 },
  taskInfo: { flex: 1 },
  taskName: { color: '#071e60', fontSize: 17, fontWeight: '900' },
  taskMeta: { color: '#263b68', fontSize: 14, fontWeight: '800', marginTop: 4 },
  statusPill: { minWidth: 112, height: 40, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, marginLeft: 10 },
  statusText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  taskStatusCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  taskStatusMark: { fontSize: 16, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.42)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  submitModalCard: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  suggestModalCard: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  childMessagesModalCard: { width: '100%', maxWidth: 390, height: '76%', borderRadius: 18, backgroundColor: '#ffffff', padding: 18, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  childNotificationsModalCard: { width: '100%', maxWidth: 390, maxHeight: '76%', borderRadius: 18, backgroundColor: '#ffffff', padding: 18, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { color: '#071e60', fontSize: 24, fontWeight: '900' },
  modalClose: { color: '#536079', fontSize: 30, lineHeight: 30, fontWeight: '500' },
  submitTaskRow: { minHeight: 76, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  existingImageBox: { marginBottom: 14 },
  evidenceLabel: { color: '#4c5877', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  evidenceImage: { width: '100%', height: 150, borderRadius: 14, backgroundColor: '#edf1f7' },
  pickImageButton: { minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#0065ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: '#f8fbff' },
  pickImageButtonText: { color: '#0065ff', fontSize: 15, fontWeight: '900' },
  previewImage: { width: '100%', height: 190, borderRadius: 15, backgroundColor: '#edf1f7', marginBottom: 12 },
  previewPlaceholder: { height: 150, borderRadius: 15, borderWidth: 1, borderColor: '#dce3ef', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginBottom: 12 },
  previewPlaceholderText: { color: '#52607b', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  modalHint: { color: '#52607b', fontSize: 14, fontWeight: '800', textAlign: 'center', lineHeight: 20 },
  submitErrorText: { color: '#b42318', fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  submitActionsRow: { flexDirection: 'row', gap: 12 },
  cancelSubmitButton: { flex: 1, minHeight: 52, borderRadius: 13, borderWidth: 1.5, borderColor: '#0065ff', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  cancelSubmitButtonText: { color: '#0065ff', fontSize: 16, fontWeight: '900' },
  submitDoneButton: { flex: 1, minHeight: 52, borderRadius: 13, backgroundColor: '#0ca85d', alignItems: 'center', justifyContent: 'center' },
  submitDoneButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  disabledButton: { opacity: 0.7 },
  rewardsRow: { gap: 14, paddingRight: 6, paddingBottom: 2 },
  rewardsList: { gap: 12 },
  suggestRewardButton: { minHeight: 54, borderRadius: 16, borderWidth: 1.5, borderColor: '#0ca85d', backgroundColor: '#f4fff9', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 14 },
  suggestRewardButtonText: { color: '#0ca85d', fontSize: 16, fontWeight: '900' },
  rewardCard: { width: 146, minHeight: 172, borderRadius: 18, backgroundColor: '#fff0bd', padding: 12, alignItems: 'center' },
  rewardCardList: { width: '100%', minHeight: 104, borderWidth: 1, borderColor: '#d7f1e5', backgroundColor: '#fbfffd', flexDirection: 'row', alignItems: 'center', padding: 12 },
  rewardIconBox: { width: 96, height: 78, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.36)' },
  rewardIconBoxList: { width: 78, height: 78, borderRadius: 18, marginRight: 13 },
  rewardIcon: { width: 70, height: 70 },
  rewardIconList: { width: 58, height: 58 },
  rewardListInfo: { flex: 1, alignItems: 'flex-start' },
  rewardName: { color: '#071e60', fontSize: 15, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  rewardNameList: { marginTop: 0, textAlign: 'left', fontSize: 17 },
  rewardPoints: { color: '#263b68', fontSize: 13, fontWeight: '900', marginTop: 4 },
  rewardPointsList: { color: '#0b7f49', fontSize: 14 },
  rewardRequestText: { color: '#b97000', fontSize: 12, fontWeight: '900', marginTop: 10 },
  rewardLockedText: { color: '#52607b', fontSize: 12, fontWeight: '800', marginTop: 10 },
  rewardButton: { minHeight: 44, borderRadius: 13, backgroundColor: '#0ca85d', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 18 },
  rewardButtonList: { minWidth: 104, marginTop: 0, marginLeft: 10, paddingHorizontal: 18 },
  rewardButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  suggestInputLabel: { color: '#052461', fontSize: 14, fontWeight: '900', marginBottom: 8, marginTop: 8 },
  suggestInput: { minHeight: 52, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 13, paddingHorizontal: 15, color: '#071e60', fontSize: 16, fontWeight: '700', backgroundColor: '#fbfdff', marginBottom: 10 },
  suggestTimeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 12 },
  suggestTimeOption: { minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: '#dce3ef', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  suggestTimeOptionSelected: { borderColor: '#0ca85d', backgroundColor: '#effced' },
  suggestTimeText: { color: '#52607b', fontSize: 13, fontWeight: '800' },
  suggestTimeTextSelected: { color: '#0ca85d' },
  suggestIconRow: { gap: 10, paddingRight: 2, paddingBottom: 12 },
  suggestIconOption: { width: 78, minHeight: 88, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: '#ffffff' },
  suggestIconOptionSelected: { borderColor: '#0ca85d', backgroundColor: '#effced' },
  suggestIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  suggestIconImage: { width: 36, height: 36 },
  suggestIconLabel: { color: '#536079', fontSize: 11, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  suggestIconLabelSelected: { color: '#0ca85d' },
  chatSubtitle: { color: '#52607b', fontSize: 14, fontWeight: '900', marginBottom: 10 },
  chatMessagesList: { flex: 1, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 16, backgroundColor: '#fbfdff', padding: 10, marginBottom: 12 },
  chatEmptyBox: { minHeight: 170, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  chatBubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 9 },
  chatBubbleMine: { alignSelf: 'flex-end', backgroundColor: '#0065ff', borderBottomRightRadius: 5 },
  chatBubbleTheirs: { alignSelf: 'flex-start', backgroundColor: '#eef4ff', borderBottomLeftRadius: 5 },
  chatBubbleText: { color: '#071e60', fontSize: 14, lineHeight: 19, fontWeight: '800' },
  chatBubbleTextMine: { color: '#ffffff' },
  chatBubbleTime: { color: '#8790a7', fontSize: 10, fontWeight: '800', marginTop: 4, textAlign: 'right' },
  chatBubbleTimeMine: { color: '#dceaff' },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatInput: { flex: 1, minHeight: 48, maxHeight: 96, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, color: '#071e60', fontSize: 15, fontWeight: '800', backgroundColor: '#fbfdff' },
  chatSendButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#0065ff', alignItems: 'center', justifyContent: 'center' },
  childNotificationsList: { maxHeight: 430 },
  childNotificationRow: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: 'row', backgroundColor: '#fbfdff' },
  childNotificationRowRead: { backgroundColor: '#f3f6fb', borderColor: '#edf1f7' },
  childNotificationTypePill: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#eaf2ff', paddingHorizontal: 9, paddingVertical: 5, marginRight: 10 },
  childNotificationTypePillRead: { backgroundColor: '#eef1f6' },
  childNotificationTypeText: { color: '#0065ff', fontSize: 11, fontWeight: '900' },
  childNotificationBody: { flex: 1 },
  childNotificationTitle: { color: '#071e60', fontSize: 15, fontWeight: '900' },
  childNotificationTitleRead: { color: '#536079' },
  childNotificationText: { color: '#4c5877', fontSize: 13, lineHeight: 18, marginTop: 4 },
  childNotificationTime: { color: '#8790a7', fontSize: 12, marginTop: 6 },
  emptyState: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 15, padding: 18, alignItems: 'center' },
  emptyText: { color: '#52607b', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  profileModule: { marginTop: 8 },
  profileHeaderCard: { minHeight: 230, borderRadius: 22, backgroundColor: '#83ddff', padding: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  profileCloudOne: { position: 'absolute', right: 34, top: 32, width: 96, height: 38, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.66)' },
  profileCloudTwo: { position: 'absolute', left: 18, top: 76, width: 78, height: 32, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.48)' },
  profileSun: { position: 'absolute', right: 128, top: 78, width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffd54d' },
  profileHillBack: { position: 'absolute', left: -42, right: -42, bottom: -50, height: 106, borderTopLeftRadius: 150, borderTopRightRadius: 150, backgroundColor: '#bdf36f' },
  profileHillFront: { position: 'absolute', right: -35, bottom: -65, width: 210, height: 122, borderTopLeftRadius: 140, backgroundColor: '#6ed13a' },
  profileHouse: { position: 'absolute', right: 38, bottom: 38, width: 50, height: 37, borderRadius: 6, backgroundColor: '#ffd46a', borderWidth: 1, borderColor: '#efad3a' },
  profileRoof: { position: 'absolute', left: -6, top: -17, width: 62, height: 24, borderRadius: 5, backgroundColor: '#f26b24', transform: [{ rotate: '-8deg' }] },
  profileChimney: { position: 'absolute', right: 8, top: -22, width: 8, height: 17, borderRadius: 3, backgroundColor: '#c94d1a' },
  profileDoor: { position: 'absolute', left: 20, bottom: 0, width: 12, height: 20, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: '#9f6b3d' },
  profileWindow: { position: 'absolute', right: 6, top: 12, width: 11, height: 11, borderRadius: 3, backgroundColor: '#a8e8ff', borderWidth: 1, borderColor: '#ffffff' },
  profileAvatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#dfe5ff', marginBottom: 12, borderWidth: 5, borderColor: '#ffffff' },
  profileName: { color: '#071e60', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  profileSubtitle: { color: '#52607b', fontSize: 14, fontWeight: '800', marginTop: 5 },
  profileStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  profileStatCard: { width: '48%', minHeight: 142, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 17, backgroundColor: '#ffffff', padding: 14, alignItems: 'center', justifyContent: 'center' },
  profileStatIconBox: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  profileStatImage: { width: 62, height: 62 },
  profileStatValue: { color: '#071e60', fontSize: 27, fontWeight: '900' },
  profileStatLabel: { color: '#52607b', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  profileLevelCard: { minHeight: 120, borderRadius: 20, backgroundColor: '#f1eaff', padding: 14, marginTop: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#7a61c7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  profileLevelBadge: { width: 64, height: 74, borderRadius: 20, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  profileLevelBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  profileLevelNumber: { color: '#ffffff', fontSize: 33, lineHeight: 37, fontWeight: '900' },
  profileLevelInfo: { flex: 1 },
  profileSectionTitle: { color: '#071e60', fontSize: 20, fontWeight: '900' },
  profileLevelHint: { color: '#34456e', fontSize: 13, fontWeight: '800', marginTop: 6, marginBottom: 9 },
  profileLevelTrack: { height: 12, borderRadius: 8, backgroundColor: '#ffffff', overflow: 'hidden' },
  profileLevelFill: { height: '100%', borderRadius: 8, backgroundColor: '#3fdd13' },
  profileLevelScore: { color: '#071e60', fontSize: 13, fontWeight: '900', marginTop: 7 },
  profileMedalsCard: { borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0e8f4', padding: 14, marginTop: 14, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 3 },
  profileMedalsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  profileMedalItem: { flex: 1, minHeight: 132, borderRadius: 16, backgroundColor: '#fbfdff', borderWidth: 1, borderColor: '#dfe8f6', padding: 10, alignItems: 'center', justifyContent: 'center' },
  profileMedalLocked: { opacity: 0.72, backgroundColor: '#f6f8fb' },
  profileMedalIconBox: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: '#fff8df' },
  profileMedalIconBoxLocked: { backgroundColor: '#eef2f7' },
  profileMedalImage: { width: 58, height: 58 },
  profileMedalImageLocked: { opacity: 0.42 },
  profileMedalTitle: { color: '#071e60', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  profileMedalTitleLocked: { color: '#7b879a' },
  profileMedalDescription: { color: '#52607b', fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  childLogoutButton: { minHeight: 54, borderRadius: 18, borderWidth: 1.5, borderColor: '#ff4d4f', backgroundColor: '#fff4f4', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 10 },
  childLogoutButtonText: { color: '#d92d20', fontSize: 17, fontWeight: '900' },
  encouragementCard: { minHeight: 92, borderRadius: 22, backgroundColor: '#fff3ba', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#d6a91d', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 4 },
  encouragementTextBox: { flex: 1, marginLeft: 12 },
  encouragementTitle: { color: '#2c2f3a', fontSize: 23, fontWeight: '900' },
  encouragementSubtitle: { color: '#34456e', fontSize: 14, fontWeight: '800', marginTop: 5 },
  dailyGoalPill: { minHeight: 62, borderRadius: 14, backgroundColor: '#0065ff', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  dailyGoalTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  dailyGoalText: { color: '#ffffff', fontSize: 12, fontWeight: '700', marginTop: 2 },
  bottomNav: { position: 'absolute', left: 14, right: 14, bottom: 22, minHeight: 76, paddingTop: 9, paddingBottom: 9, borderRadius: 24, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
  navLabel: { color: '#59677f', fontSize: 12, marginTop: 4, fontWeight: '800' },
  navLabelActive: { color: '#0065ff' },
});
