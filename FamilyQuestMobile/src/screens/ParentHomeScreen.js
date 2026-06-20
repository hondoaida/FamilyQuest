import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getMyChildren } from '../services/childrenService';
import { getMyMessages, sendMessage } from '../services/messageService';
import { getRewardRequests, REWARD_REQUEST_STATUSES, updateRewardRequestStatus } from '../services/rewardRequestService';
import { getRewards } from '../services/rewardService';
import { getRewardSuggestions, REWARD_SUGGESTION_STATUSES, updateRewardSuggestionStatus } from '../services/rewardSuggestionService';
import { getTasks, TASK_STATUSES, updateTaskStatus } from '../services/taskService';
import { getChildAvatarSource } from '../utils/childAvatars';
import { getParentAvatarSource } from '../utils/parentAvatars';

const icons = {
  bell: require('../../assets/home-icons/bell.png'),
  user: require('../../assets/home-icons/user.png'),
  clipboard: require('../../assets/home-icons/clipboard.png'),
  checkCircle: require('../../assets/home-icons/check-circle.png'),
  chart: require('../../assets/home-icons/chart.png'),
  gift: require('../../assets/home-icons/gift.png'),
  trophy: require('../../assets/home-icons/trophy.png'),
  star: require('../../assets/home-icons/star.png'),
  medal: require('../../assets/home-icons/medal.png'),
  chat: require('../../assets/home-icons/chat.png'),
  send: require('../../assets/home-icons/send.png'),
  plusCircle: require('../../assets/home-icons/plus-circle.png'),
  home: require('../../assets/home-icons/home.png'),
  profile: require('../../assets/home-icons/profile.png'),
  chevronRight: require('../../assets/home-icons/chevron-right.png'),
  taskGraphic: require('../../assets/taskt-item/task.png'),
};

const rewardIconSources = {
  gamepad: { image: require('../../assets/reward-items/gamepad.png'), color: '#eee4ff' },
  'ice-cream': { image: require('../../assets/reward-items/ice-cream.png'), color: '#ffdce8' },
  'travel-car': { image: require('../../assets/reward-items/travel-car.png'), color: '#e7f8d9' },
  picnic: { image: require('../../assets/reward-items/picnic.png'), color: '#fff0ba' },
  'shopping-bag': { image: require('../../assets/reward-items/shopping-bag.png'), color: '#e8f2ff' },
  suitcase: { image: require('../../assets/reward-items/suitcase.png'), color: '#f0ecff' },
};

const rewardReviewTimeOptions = [
  { label: 'Predloženo', offsetDays: null },
  { label: 'Danas', offsetDays: 0 },
  { label: 'Sutra', offsetDays: 1 },
  { label: 'Za 3 dana', offsetDays: 3 },
  { label: 'Za 7 dana', offsetDays: 7 },
  { label: 'Za 14 dana', offsetDays: 14 },
  { label: 'Za 30 dana', offsetDays: 30 },
];

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

export function ParentHomeScreen({
  token,
  user,
  onNavigateToAddChild,
  onNavigateToChildren,
  onNavigateHome,
  onNavigateToRewards,
  onNavigateToProfile,
  openMessagesOnStart,
  onMessagesOpened,
}) {
  const [children, setChildren] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [childrenError, setChildrenError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');
  const [rewards, setRewards] = useState([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [rewardsError, setRewardsError] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [isMessagesVisible, setIsMessagesVisible] = useState(false);
  const [selectedMessageChildId, setSelectedMessageChildId] = useState(null);
  const [readMessageChildIds, setReadMessageChildIds] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [rewardSuggestions, setRewardSuggestions] = useState([]);
  const [isLoadingRewardSuggestions, setIsLoadingRewardSuggestions] = useState(false);
  const [rewardSuggestionsError, setRewardSuggestionsError] = useState('');
  const [selectedRewardSuggestion, setSelectedRewardSuggestion] = useState(null);
  const [reviewingSuggestionId, setReviewingSuggestionId] = useState(null);
  const [selectedRewardRequest, setSelectedRewardRequest] = useState(null);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [isTaskStatsVisible, setIsTaskStatsVisible] = useState(false);
  const [isRewardStatsVisible, setIsRewardStatsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadChildren = async () => {
      if (!token) {
        setChildrenError('Niste prijavljeni. Molimo prijavite se ponovo.');
        return;
      }

      setIsLoadingChildren(true);
      setChildrenError('');

      try {
        const response = await getMyChildren({ token });
        if (isMounted) {
          setChildren(response);
        }
      } catch (error) {
        if (isMounted) {
          setChildrenError(error.message || 'Učitavanje djece nije uspjelo.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingChildren(false);
        }
      }
    };

    loadChildren();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (openMessagesOnStart) {
      handleOpenMessages();
      onMessagesOpened?.();
    }
  }, [openMessagesOnStart, onMessagesOpened]);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      if (!token) {
        return;
      }

      setIsLoadingMessages(true);
      setMessagesError('');

      try {
        const response = await getMyMessages({ token });
        if (isMounted) {
          setMessages(response);
        }
      } catch (error) {
        if (isMounted) {
          setMessagesError(error.message || 'Ucitavanje poruka nije uspjelo.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadRewardRequests = async () => {
      if (!token) {
        return;
      }

      try {
        const response = await getRewardRequests({ token });
        if (isMounted) {
          setRewardRequests(response ?? []);
        }
      } catch {
        if (isMounted) {
          setRewardRequests([]);
        }
      }
    };

    loadRewardRequests();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadRewardSuggestions = async () => {
      if (!token) {
        return;
      }

      setIsLoadingRewardSuggestions(true);
      setRewardSuggestionsError('');

      try {
        const response = await getRewardSuggestions({ token });
        if (isMounted) {
          setRewardSuggestions(response ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setRewardSuggestionsError(error.message || 'Ucitavanje prijedloga nagrada nije uspjelo.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingRewardSuggestions(false);
        }
      }
    };

    loadRewardSuggestions();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      if (!token) {
        return;
      }

      setIsLoadingTasks(true);
      setTasksError('');

      try {
        const response = await getTasks({ token });
        if (isMounted) {
          setTasks(response);
        }
      } catch (error) {
        if (isMounted) {
          setTasksError(error.message || 'Učitavanje zadataka nije uspjelo.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingTasks(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadRewards = async () => {
      if (!token) {
        return;
      }

      setIsLoadingRewards(true);
      setRewardsError('');

      try {
        const response = await getRewards({ token });
        if (isMounted) {
          setRewards(response);
        }
      } catch (error) {
        if (isMounted) {
          setRewardsError(error.message || 'Učitavanje nagrada nije uspjelo.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingRewards(false);
        }
      }
    };

    loadRewards();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const taskStats = useMemo(() => {
    const assignedTaskItems = tasks.filter((task) => isTaskStatus(task.status, TASK_STATUSES.assigned, 'Assigned'));
    const pendingTaskItems = tasks.filter((task) => isTaskStatus(task.status, TASK_STATUSES.pendingApproval, 'PendingApproval'));
    const approvedTaskItems = tasks.filter((task) => isTaskStatus(task.status, TASK_STATUSES.approved, 'Approved'));
    const rejectedTaskItems = tasks.filter((task) => isTaskStatus(task.status, TASK_STATUSES.rejected, 'Rejected'));
    const activeTasks = assignedTaskItems.length + pendingTaskItems.length;
    const approvedPoints = approvedTaskItems
      .reduce((total, task) => total + getTaskPoints(task), 0);
    const childTaskResults = children.map((child) => {
      const childId = getChildUserId(child);
      const completedCount = approvedTaskItems.filter((task) => sameId(task.childId, childId)).length;
      const totalForChild = tasks.filter((task) => sameId(task.childId, childId)).length;

      return {
        name: child.childName,
        count: completedCount,
        total: totalForChild,
      };
    });
    const mostSuccessfulChild = getChildStatExtreme(childTaskResults, 'max');
    const leastSuccessfulChild = getChildStatExtreme(childTaskResults, 'min');
    const decidedTasks = approvedTaskItems.length + rejectedTaskItems.length + activeTasks;
    const progress = decidedTasks === 0 ? 0 : Math.round((approvedTaskItems.length / decidedTasks) * 100);

    return {
      activeTasks,
      approvedTasks: approvedTaskItems.length,
      assignedTasks: assignedTaskItems.length,
      pendingTasks: pendingTaskItems.length,
      rejectedTasks: rejectedTaskItems.length,
      approvedPoints,
      leastSuccessfulChild,
      mostSuccessfulChild,
      progress,
      totalTasks: tasks.length,
    };
  }, [children, tasks]);

  const rewardStats = useMemo(() => {
    const activeRewards = rewards.filter((reward) => reward.isActive !== false);
    const inactiveRewards = rewards.filter((reward) => reward.isActive === false);
    const approvedTaskItems = tasks
      .filter((task) => isTaskStatus(task.status, TASK_STATUSES.approved, 'Approved'));
    const approvedPoints = approvedTaskItems
      .reduce((total, task) => total + getTaskPoints(task), 0);
    const pointsByChildId = children.reduce((result, child) => {
      const childId = getChildUserId(child);
      result[String(childId)] = approvedTaskItems
        .filter((task) => sameId(task.childId, childId))
        .reduce((total, task) => total + getTaskPoints(task), 0);
      return result;
    }, {});
    const pendingRewardRequestItems = rewardRequests.filter((request) => isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.pending, 'Pending'));
    const approvedRewardRequestItems = rewardRequests.filter((request) => isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.approved, 'Approved'));
    const rejectedRewardRequestItems = rewardRequests.filter((request) => isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.rejected, 'Rejected'));
    const activeRequestRewardIds = rewardRequests
      .filter((request) => isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.pending, 'Pending') || isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.approved, 'Approved'))
      .map((request) => String(request.rewardId));
    const affordableRewardItems = activeRewards.filter((reward) => {
      const childPoints = pointsByChildId[String(reward.childId)] ?? 0;
      return getRewardPoints(reward) <= childPoints && !activeRequestRewardIds.includes(String(reward.id));
    });
    const lockedRewardItems = activeRewards.filter((reward) => {
      const childPoints = pointsByChildId[String(reward.childId)] ?? 0;
      return getRewardPoints(reward) > childPoints;
    });
    const totalRewardCost = activeRewards.reduce((total, reward) => total + getRewardPoints(reward), 0);
    const averageRewardCost = activeRewards.length === 0 ? 0 : Math.round(totalRewardCost / activeRewards.length);
    const childRewardResults = children.map((child) => {
      const childId = getChildUserId(child);
      const approvedCount = approvedRewardRequestItems.filter((request) => sameId(request.childId, childId)).length;

      return {
        name: child.childName,
        count: approvedCount,
      };
    });
    const mostRewardedChild = getChildStatExtreme(childRewardResults, 'max');
    const leastRewardedChild = getChildStatExtreme(childRewardResults, 'min');
    const pendingSuggestionItems = rewardSuggestions.filter((suggestion) => isRewardSuggestionStatus(suggestion.status, REWARD_SUGGESTION_STATUSES.pending, 'Pending'));

    return {
      activeRewards: activeRewards.length,
      availableRewards: activeRewards.length,
      affordableRewards: affordableRewardItems.length,
      approvedPoints,
      approvedRequests: approvedRewardRequestItems.length,
      averageRewardCost,
      inactiveRewards: inactiveRewards.length,
      leastRewardedChild,
      lockedRewards: lockedRewardItems.length,
      mostRewardedChild,
      pendingRequests: pendingRewardRequestItems.length,
      pendingSuggestions: pendingSuggestionItems.length,
      rejectedRequests: rejectedRewardRequestItems.length,
      totalRewardCost,
      totalRewards: rewards.length,
    };
  }, [children, rewardRequests, rewardSuggestions, rewards, tasks]);

  const pendingRewardSuggestions = useMemo(() => (
    rewardSuggestions.filter((suggestion) => isRewardSuggestionStatus(suggestion.status, REWARD_SUGGESTION_STATUSES.pending, 'Pending'))
  ), [rewardSuggestions]);

  const pendingRewardRequests = useMemo(() => (
    rewardRequests.filter((request) => isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.pending, 'Pending'))
  ), [rewardRequests]);

  const selectedMessageChild = useMemo(() => (
    children.find((child) => sameId(getChildUserId(child), selectedMessageChildId)) ?? null
  ), [children, selectedMessageChildId]);

  const notifications = useMemo(() => {
    const taskNotifications = tasks
      .filter((task) => isTaskStatus(task.status, TASK_STATUSES.pendingApproval, 'PendingApproval'))
      .map((task) => ({
        id: `task-${task.id}`,
        type: 'Zadatak',
        title: 'Zadatak čeka odobrenje',
        text: `${getChildNameById(children, task.childId)} je poslao/la dokaz za "${task.name}".`,
        date: task.submittedAt ?? task.dueDate,
        actionType: 'task',
        payload: task,
      }));

    const suggestionNotifications = pendingRewardSuggestions.map((suggestion) => ({
      id: `suggestion-${suggestion.id}`,
      type: 'Prijedlog',
      title: 'Nova predložena nagrada',
      text: `${suggestion.childName} predlaže "${suggestion.name}".`,
      date: suggestion.suggestedAt,
      actionType: 'suggestion',
      payload: suggestion,
    }));

    const rewardRequestNotifications = pendingRewardRequests.map((request) => {
      const reward = rewards.find((currentReward) => sameId(currentReward.id, request.rewardId));

      return {
        id: `reward-request-${request.id}`,
        type: 'Nagrada',
        title: 'Nagrada je zatražena',
        text: `${getChildNameById(children, request.childId)} je zatražio/la "${reward?.name || 'nagradu'}".`,
        date: request.requestDate,
        actionType: 'rewardRequest',
        payload: request,
      };
    });

    return [...taskNotifications, ...suggestionNotifications, ...rewardRequestNotifications]
      .sort((first, second) => new Date(second.date ?? 0) - new Date(first.date ?? 0));
  }, [children, pendingRewardRequests, pendingRewardSuggestions, rewards, tasks]);

  const handleReviewRewardSuggestion = async ({ suggestion, status, requiredPoints, dueDate }) => {
    setReviewingSuggestionId(suggestion.id);

    try {
      const updatedSuggestion = await updateRewardSuggestionStatus({
        token,
        suggestionId: suggestion.id,
        status,
        requiredPoints,
        dueDate,
      });

      setRewardSuggestions((currentSuggestions) => currentSuggestions.map((currentSuggestion) => (
        currentSuggestion.id === suggestion.id ? updatedSuggestion : currentSuggestion
      )));

      if (status === REWARD_SUGGESTION_STATUSES.approved) {
        const loadedRewards = await getRewards({ token });
        setRewards(loadedRewards ?? []);
      }

      setSelectedRewardSuggestion(null);
      Alert.alert(status === REWARD_SUGGESTION_STATUSES.approved ? 'Nagrada odobrena' : 'Prijedlog odbijen');
    } catch (error) {
      Alert.alert('Greška', error.message || 'Obrada prijedloga nagrade nije uspjela.');
    } finally {
      setReviewingSuggestionId(null);
    }
  };

  const handleUpdateTaskStatus = async (status) => {
    if (!token || !selectedTask) {
      return;
    }

    setIsUpdatingTask(true);

    try {
      await updateTaskStatus({ token, taskId: selectedTask.id, status });
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === selectedTask.id ? { ...task, status } : task
      )));
      setSelectedTask(null);
      Alert.alert(status === TASK_STATUSES.approved ? 'Zadatak odobren' : 'Zadatak odbijen');
    } catch (error) {
      Alert.alert('Greška', error.message || 'Ažuriranje zadatka nije uspjelo.');
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleReviewRewardRequest = async ({ request, status }) => {
    setReviewingRequestId(request.id);

    try {
      const updatedRequest = await updateRewardRequestStatus({
        token,
        requestId: request.id,
        status,
      });

      setRewardRequests((currentRequests) => currentRequests.map((currentRequest) => (
        currentRequest.id === request.id ? (updatedRequest ?? { ...currentRequest, status }) : currentRequest
      )));

      setSelectedRewardRequest(null);
      Alert.alert(status === REWARD_REQUEST_STATUSES.approved ? 'Nagrada odobrena' : 'Zahtjev odbijen');
    } catch (error) {
      Alert.alert('Greška', error.message || 'Obrada zahtjeva za nagradu nije uspjela.');
    } finally {
      setReviewingRequestId(null);
    }
  };

  const handleNotificationPress = (notification) => {
    setIsNotificationsVisible(false);

    if (notification.actionType === 'task') {
      setSelectedTask(notification.payload);
      return;
    }

    if (notification.actionType === 'suggestion') {
      setSelectedRewardSuggestion(notification.payload);
      return;
    }

    if (notification.actionType === 'rewardRequest') {
      setSelectedRewardRequest(notification.payload);
    }
  };

  const handleOpenMessages = (childId = null) => {
    setSelectedMessageChildId(childId);
    if (childId) {
      setReadMessageChildIds((currentIds) => (
        currentIds.some((currentId) => sameId(currentId, childId)) ? currentIds : [...currentIds, childId]
      ));
    }
    setIsMessagesVisible(true);
  };

  const handleSendMessage = async () => {
    const receiverId = getChildUserId(selectedMessageChild);
    const content = messageDraft.trim();

    if (!token || !receiverId || !content) {
      return;
    }

    setIsSendingMessage(true);

    try {
      const createdMessage = await sendMessage({ token, receiverId, content });
      setMessages((currentMessages) => [...currentMessages, createdMessage]);
      setMessageDraft('');
    } catch (error) {
      Alert.alert('Greška', error.message || 'Slanje poruke nije uspjelo.');
    } finally {
      setIsSendingMessage(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTextBox}>
              <Text style={styles.welcomeText}>Dobrodošla nazad,</Text>
              <Text style={styles.userName}>{user?.name || 'Roditelj'} 👋</Text>
              <Text style={styles.subText}>Drago nam je što ste tu!</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable style={styles.bellButton} onPress={() => setIsNotificationsVisible(true)}>
                <Icon source={icons.bell} size={32} color="#44506a" />
                {notifications.length > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notifications.length > 99 ? '99+' : notifications.length}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable onPress={onNavigateToProfile} hitSlop={8}>
                <Image source={getParentAvatarSource(user?.avatarKey)} style={styles.parentAvatar} />
              </Pressable>
            </View>
          </View>

          <SectionCard title="Dijete" icon={icons.user} actionText="Upravljaj djecom" actionColor="#0065ff" onActionPress={onNavigateToChildren}>
            <ChildrenContent
              children={children}
              error={childrenError}
              isLoading={isLoadingChildren}
              onChildPress={onNavigateToChildren}
            />
            <DashedButton label="Dodaj dijete" icon={icons.plusCircle} color="#0065ff" onPress={onNavigateToAddChild} />
          </SectionCard>

          <SectionCard title="Zadaci" image={icons.taskGraphic} actionText="Pogledaj sve" actionColor="#0065ff" onActionPress={() => setIsTaskStatsVisible(true)}>
            <StatsContent
              isLoading={isLoadingTasks}
              error={tasksError}
              loadingText="Učitavanje statistike zadataka..."
            >
              <StatsPanel>
                <StatItem image={icons.taskGraphic} value={taskStats.activeTasks} label="Aktivnih zadataka" color="#0065ff" />
                <StatItem icon={icons.checkCircle} value={taskStats.approvedTasks} label="Završenih zadataka" color="#0065ff" />
                <StatItem icon={icons.chart} value={`${taskStats.progress}%`} label="Ukupni napredak" color="#0065ff" />
              </StatsPanel>
            </StatsContent>

          </SectionCard>

          <SectionCard title="Nagrade" image={rewardIconSources.gamepad.image} actionText="Pogledaj sve" actionColor="#079452" accentColor="#10a96b" onActionPress={() => setIsRewardStatsVisible(true)}>
            <StatsContent
              isLoading={isLoadingRewards}
              error={rewardsError}
              loadingText="Učitavanje statistike nagrada..."
            >
              <StatsPanel tinted>
                <StatItem image={rewardIconSources.suitcase.image} value={rewardStats.availableRewards} label="Dostupne nagrade" color="#10a96b" />
                <StatItem image={rewardIconSources['ice-cream'].image} value={rewardStats.affordableRewards} label="Ostvarive nagrade" color="#10a96b" />
                <StatItem image={rewardIconSources.picnic.image} value={rewardStats.approvedRequests} label="Osvojene nagrade" color="#10a96b" />
              </StatsPanel>
            </StatsContent>

          </SectionCard>

          <SectionCard title="Aktivnosti" icon={icons.bell} actionText="Pogledaj sve" actionColor="#0065ff" onActionPress={() => setIsNotificationsVisible(true)}>
            <View style={styles.messageList}>
              {notifications.length === 0 ? (
                <View style={styles.messageStateBox}>
                  <Text style={styles.childrenStateText}>Nema novih aktivnosti.</Text>
                </View>
              ) : null}

              {notifications.slice(0, 4).map((notification) => (
                <Pressable key={notification.id} style={styles.messageRow} onPress={() => handleNotificationPress(notification)}>
                  <View style={styles.notificationTypePill}>
                    <Text style={styles.notificationTypeText}>{notification.type}</Text>
                  </View>
                  <View style={styles.messageBody}>
                    <Text style={styles.messageSender}>{notification.title}</Text>
                    <Text style={styles.messageText}>{notification.text}</Text>
                  </View>
                  <View style={styles.messageMeta}>
                    <Text style={styles.messageTime}>{formatMessageTime(notification.date)}</Text>
                    <Icon source={icons.chevronRight} size={18} color="#8790a7" />
                  </View>
                </Pressable>
              ))}
            </View>
          </SectionCard>
        </ScrollView>

        <BottomNavigation
          onNavigateHome={onNavigateHome}
          onNavigateChildren={onNavigateToChildren}
          onNavigateRewards={onNavigateToRewards}
          onNavigateMessages={() => handleOpenMessages()}
          onNavigateProfile={onNavigateToProfile}
        />
        <StatsDetailsModal
          visible={isTaskStatsVisible}
          title="Statistika zadataka"
          color="#0065ff"
          onClose={() => setIsTaskStatsVisible(false)}
          stats={[
            { label: 'Ukupno zadataka', value: taskStats.totalTasks, image: icons.taskGraphic },
            { label: 'Dodijeljeni', value: taskStats.assignedTasks, image: icons.taskGraphic },
            { label: 'Čekaju odobrenje', value: taskStats.pendingTasks, icon: icons.bell },
            { label: 'Završeni', value: taskStats.approvedTasks, icon: icons.checkCircle },
            { label: 'Otkazani', value: taskStats.rejectedTasks, icon: icons.chart },
            { label: 'Osvojeni bodovi', value: taskStats.approvedPoints, icon: icons.star },
            { label: 'Najviše uspješnih', value: formatChildStat(taskStats.mostSuccessfulChild, 'zad.'), icon: icons.trophy },
            { label: 'Najmanje uspješnih', value: formatChildStat(taskStats.leastSuccessfulChild, 'zad.'), icon: icons.user },
          ]}
          highlight={`${taskStats.progress}% ukupni napredak`}
          hint="Napredak se računa prema broju odobrenih zadataka u odnosu na sve zadatke djece."
        />
        <StatsDetailsModal
          visible={isRewardStatsVisible}
          title="Statistika nagrada"
          color="#10a96b"
          onClose={() => setIsRewardStatsVisible(false)}
          stats={[
            { label: 'Ukupno nagrada', value: rewardStats.totalRewards, image: rewardIconSources['shopping-bag'].image },
            { label: 'Aktivne', value: rewardStats.activeRewards, image: rewardIconSources.suitcase.image },
            { label: 'Neaktivne', value: rewardStats.inactiveRewards, image: rewardIconSources.gamepad.image },
            { label: 'Ostvarive sada', value: rewardStats.affordableRewards, image: rewardIconSources['ice-cream'].image },
            { label: 'Još zaključane', value: rewardStats.lockedRewards, image: rewardIconSources['travel-car'].image },
            { label: 'Zatražene', value: rewardStats.pendingRequests, icon: icons.bell },
            { label: 'Osvojene', value: rewardStats.approvedRequests, image: rewardIconSources.picnic.image },
            { label: 'Odbijeni zahtjevi', value: rewardStats.rejectedRequests, icon: icons.chart },
            { label: 'Predložene čekaju', value: rewardStats.pendingSuggestions, icon: icons.bell },
            { label: 'Ukupna cijena aktivnih', value: rewardStats.totalRewardCost, icon: icons.chart },
            { label: 'Prosjek bodova', value: rewardStats.averageRewardCost, icon: icons.star },
            { label: 'Najviše osvojenih', value: formatChildStat(rewardStats.mostRewardedChild, 'nagr.'), image: rewardIconSources.picnic.image },
            { label: 'Najmanje osvojenih', value: formatChildStat(rewardStats.leastRewardedChild, 'nagr.'), icon: icons.user },
          ]}
          highlight={`${rewardStats.approvedPoints} bodova je trenutno osvojeno`}
          hint="Ostvarive nagrade se računaju po djetetu: aktivna nagrada, dovoljno bodova tog djeteta i bez postojećeg zahtjeva."
        />
        <NotificationsModal
          visible={isNotificationsVisible}
          notifications={notifications}
          onClose={() => setIsNotificationsVisible(false)}
          onNotificationPress={handleNotificationPress}
        />
        <TaskDetailsModal
          task={selectedTask}
          childName={selectedTask ? getChildNameById(children, selectedTask.childId) : ''}
          isUpdating={isUpdatingTask}
          onClose={() => setSelectedTask(null)}
          onApprove={() => handleUpdateTaskStatus(TASK_STATUSES.approved)}
          onReject={() => handleUpdateTaskStatus(TASK_STATUSES.rejected)}
        />
        <RewardRequestReviewModal
          visible={Boolean(selectedRewardRequest)}
          request={selectedRewardRequest}
          reward={selectedRewardRequest ? rewards.find((reward) => sameId(reward.id, selectedRewardRequest.rewardId)) : null}
          childName={selectedRewardRequest ? getChildNameById(children, selectedRewardRequest.childId) : ''}
          isSubmitting={selectedRewardRequest ? reviewingRequestId === selectedRewardRequest.id : false}
          onClose={() => setSelectedRewardRequest(null)}
          onReview={handleReviewRewardRequest}
        />
        <ParentMessagesModal
          visible={isMessagesVisible}
          currentUser={user}
          children={children}
          messages={messages}
          selectedChild={selectedMessageChild}
          readMessageChildIds={readMessageChildIds}
          draft={messageDraft}
          isSending={isSendingMessage}
          onSelectChild={(child) => handleOpenMessages(child ? getChildUserId(child) : null)}
          onDraftChange={setMessageDraft}
          onSend={handleSendMessage}
          onClose={() => setIsMessagesVisible(false)}
        />

      </View>
    </SafeAreaView>
  );
}

function RewardSuggestionsContent({ suggestions, error, isLoading, onSuggestionPress }) {
  if (isLoading) {
    return (
      <View style={styles.childrenStateBox}>
        <ActivityIndicator color="#f97316" />
        <Text style={styles.childrenStateText}>Učitavanje prijedloga nagrada...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.childrenStateBox}>
        <Text style={styles.childrenErrorText}>{error}</Text>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return (
      <View style={styles.childrenStateBox}>
        <Text style={styles.childrenStateTitle}>Nema novih prijedloga.</Text>
        <Text style={styles.childrenStateText}>Kada dijete predloži nagradu, pojavit će se ovdje.</Text>
      </View>
    );
  }

  return (
    <View style={styles.suggestionList}>
      {suggestions.slice(0, 4).map((suggestion) => {
        const rewardIcon = rewardIconSources[suggestion.iconKey] ?? rewardIconSources.gamepad;

        return (
          <Pressable key={suggestion.id} style={styles.suggestionRow} onPress={() => onSuggestionPress?.(suggestion)}>
            <View style={[styles.suggestionIconBox, { backgroundColor: rewardIcon.color }]}>
              <Image source={rewardIcon.image} style={styles.suggestionIcon} resizeMode="contain" />
            </View>
            <View style={styles.suggestionBody}>
              <View style={styles.suggestionTitleRow}>
                <Text style={styles.suggestionName}>{suggestion.name}</Text>
                <View style={styles.newPill}>
                  <Text style={styles.newPillText}>New</Text>
                </View>
              </View>
              <Text style={styles.suggestionMeta}>{suggestion.childName} • do {formatShortDate(suggestion.dueDate)}</Text>
            </View>
            <View style={styles.suggestionAlertCircle}>
              <Text style={styles.suggestionAlertText}>!</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function RewardSuggestionReviewModal({ visible, suggestion, isSubmitting, onClose, onReview }) {
  const [points, setPoints] = useState('');
  const [selectedTime, setSelectedTime] = useState(rewardReviewTimeOptions[0]);

  useEffect(() => {
    if (visible) {
      setPoints(suggestion?.requiredPoints ? String(suggestion.requiredPoints) : '');
      setSelectedTime(rewardReviewTimeOptions[0]);
    }
  }, [visible, suggestion?.id]);

  if (!suggestion) {
    return null;
  }

  const rewardIcon = rewardIconSources[suggestion.iconKey] ?? rewardIconSources.gamepad;

  const getApprovedDueDate = () => {
    if (selectedTime.offsetDays === null) {
      return suggestion.dueDate;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + selectedTime.offsetDays);
    dueDate.setHours(12, 0, 0, 0);
    return dueDate.toISOString();
  };

  const handleApprove = () => {
    const parsedPoints = Number(points);

    if (!Number.isFinite(parsedPoints) || parsedPoints <= 0) {
      Alert.alert('Unesite bodove', 'Za odobrenu nagradu potrebno je upisati broj bodova.');
      return;
    }

    onReview?.({
      suggestion,
      status: REWARD_SUGGESTION_STATUSES.approved,
      requiredPoints: parsedPoints,
      dueDate: getApprovedDueDate(),
    });
  };

  const handleReject = () => {
    onReview?.({
      suggestion,
      status: REWARD_SUGGESTION_STATUSES.rejected,
      requiredPoints: null,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.reviewModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Prijedlog nagrade</Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={isSubmitting}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.reviewHero}>
            <View style={[styles.reviewIconBox, { backgroundColor: rewardIcon.color }]}>
              <Image source={rewardIcon.image} style={styles.reviewIcon} resizeMode="contain" />
            </View>
            <View style={styles.reviewHeroText}>
              <Text style={styles.reviewName}>{suggestion.name}</Text>
              <Text style={styles.reviewMeta}>Predložio/la: {suggestion.childName}</Text>
              <Text style={styles.reviewMeta}>Period ostvarenja: {formatShortDate(suggestion.dueDate)}</Text>
              <Text style={styles.reviewMeta}>Poslano: {formatShortDate(suggestion.suggestedAt)}</Text>
            </View>
          </View>

          <Text style={styles.reviewInputLabel}>Broj bodova za ovu nagradu</Text>
          <TextInput
            style={styles.reviewInput}
            value={points}
            onChangeText={setPoints}
            placeholder="npr. 150"
            keyboardType="number-pad"
            editable={!isSubmitting}
          />

          <Text style={styles.reviewInputLabel}>Vrijeme za ostvarenje</Text>
          <View style={styles.reviewTimeRow}>
            {rewardReviewTimeOptions.map((option) => {
              const isSelected = selectedTime.label === option.label;

              return (
                <Pressable
                  key={option.label}
                  style={[styles.reviewTimeOption, isSelected && styles.reviewTimeOptionSelected]}
                  onPress={() => setSelectedTime(option)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.reviewTimeText, isSelected && styles.reviewTimeTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.reviewEditedDate}>Rok za nagradu: {formatShortDate(getApprovedDueDate())}</Text>

          <View style={styles.reviewActionsRow}>
            <Pressable style={[styles.rejectButton, isSubmitting && styles.disabledButton]} onPress={handleReject} disabled={isSubmitting}>
              <Text style={styles.rejectButtonText}>Odbij</Text>
            </Pressable>
            <Pressable style={[styles.approveButton, isSubmitting && styles.disabledButton]} onPress={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveButtonText}>Odobri</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TaskDetailsModal({ task, childName, isUpdating, onClose, onApprove, onReject }) {
  if (!task) {
    return null;
  }

  const canDecide = isTaskStatus(task.status, TASK_STATUSES.pendingApproval, 'PendingApproval');
  const taskIcon = taskIconSources[task.iconKey ?? task.taskIcon] ?? taskIconSources.task;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.reviewModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Detalji zadatka</Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={isUpdating}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.reviewHero}>
            <View style={[styles.reviewIconBox, { backgroundColor: taskIcon.color }]}>
              <Image source={taskIcon.image} style={styles.reviewIcon} resizeMode="contain" />
            </View>
            <View style={styles.reviewHeroText}>
              <Text style={styles.reviewName}>{task.name || 'Zadatak'}</Text>
              <Text style={styles.reviewMeta}>Dijete: {childName || 'Dijete'}</Text>
              <Text style={styles.reviewMeta}>Bodovi: {getTaskPoints(task)}</Text>
              <Text style={styles.reviewMeta}>Rok: {formatShortDate(task.dueDate)}</Text>
            </View>
          </View>

          <View style={styles.completionImageBlock}>
            <Text style={styles.reviewInputLabel}>Slika izvršenja</Text>
            {task.completionImageDataUrl ? (
              <Image source={{ uri: task.completionImageDataUrl }} style={styles.completionImage} resizeMode="cover" />
            ) : (
              <View style={styles.noCompletionImageBox}>
                <Text style={styles.noCompletionImageText}>Dijete još nije poslalo sliku za ovaj zadatak.</Text>
              </View>
            )}
          </View>

          {canDecide ? (
            <View style={styles.reviewActionsRow}>
              <Pressable style={[styles.rejectButton, isUpdating && styles.disabledButton]} onPress={onReject} disabled={isUpdating}>
                <Text style={styles.rejectButtonText}>Odbij</Text>
              </Pressable>
              <Pressable style={[styles.approveButton, isUpdating && styles.disabledButton]} onPress={onApprove} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveButtonText}>Odobri</Text>}
              </Pressable>
            </View>
          ) : (
            <Text style={styles.modalHint}>Ovaj zadatak je već obrađen.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

function RewardRequestReviewModal({ visible, request, reward, childName, isSubmitting, onClose, onReview }) {
  if (!request) {
    return null;
  }

  const rewardIcon = rewardIconSources[reward?.iconKey] ?? rewardIconSources.gamepad;
  const canDecide = isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.pending, 'Pending');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.reviewModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Zahtjev nagrade</Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={isSubmitting}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.reviewHero}>
            <View style={[styles.reviewIconBox, { backgroundColor: rewardIcon.color }]}>
              <Image source={rewardIcon.image} style={styles.reviewIcon} resizeMode="contain" />
            </View>
            <View style={styles.reviewHeroText}>
              <Text style={styles.reviewName}>{reward?.name || 'Nagrada'}</Text>
              <Text style={styles.reviewMeta}>Zatražio/la: {childName || 'Dijete'}</Text>
              <Text style={styles.reviewMeta}>Potrebni bodovi: {getRewardPoints(reward)}</Text>
              <Text style={styles.reviewMeta}>Poslano: {formatShortDate(request.requestDate)}</Text>
            </View>
          </View>

          {canDecide ? (
            <View style={styles.reviewActionsRow}>
              <Pressable
                style={[styles.rejectButton, isSubmitting && styles.disabledButton]}
                onPress={() => onReview?.({ request, status: REWARD_REQUEST_STATUSES.rejected })}
                disabled={isSubmitting}
              >
                <Text style={styles.rejectButtonText}>Odbij</Text>
              </Pressable>
              <Pressable
                style={[styles.approveButton, isSubmitting && styles.disabledButton]}
                onPress={() => onReview?.({ request, status: REWARD_REQUEST_STATUSES.approved })}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveButtonText}>Odobri</Text>}
              </Pressable>
            </View>
          ) : (
            <Text style={styles.modalHint}>Ovaj zahtjev je već obrađen.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ParentMessagesModal({ visible, currentUser, children, messages, selectedChild, readMessageChildIds, draft, isSending, onSelectChild, onDraftChange, onSend, onClose }) {
  const currentUserId = currentUser?.id ?? currentUser?.userId;
  const selectedChildId = getChildUserId(selectedChild);
  const conversationMessages = messages
    .filter((message) => isConversationMessage(message, currentUserId, selectedChildId))
    .filter((message) => !isSystemNotificationMessage(message))
    .sort((first, second) => new Date(first.sentAt) - new Date(second.sentAt));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.messagesModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Poruke</Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={isSending}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          {children.length === 0 ? (
            <View style={styles.childrenStateBox}>
              <Text style={styles.childrenStateText}>Dodajte dijete kako biste mogli slati poruke.</Text>
            </View>
          ) : !selectedChild ? (
            <ScrollView style={styles.chatContactList} showsVerticalScrollIndicator={false}>
              {children.map((child) => {
                const childId = getChildUserId(child);
                const lastMessage = getLastConversationMessage(messages, currentUserId, childId);
                const hasUnreadMessage = isUnreadConversation(lastMessage, currentUserId, readMessageChildIds, childId);

                return (
                  <Pressable key={child.id} style={[styles.chatContactRow, hasUnreadMessage && styles.messageRowUnread]} onPress={() => onSelectChild?.(child)}>
                    <View style={[styles.messageAvatar, { backgroundColor: '#0b74ff' }]}>
                      <Text style={styles.messageInitial}>{child.childName?.charAt(0)?.toUpperCase() || 'D'}</Text>
                    </View>
                    <View style={styles.messageBody}>
                      <View style={styles.messageSenderRow}>
                        <Text style={[styles.messageSender, hasUnreadMessage && styles.messageSenderUnread]}>{child.childName}</Text>
                        {hasUnreadMessage ? (
                          <View style={styles.unreadPill}>
                            <Text style={styles.unreadPillText}>Novo</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.messageText, hasUnreadMessage && styles.messageTextUnread]}>{lastMessage?.content || 'Kliknite za razgovor'}</Text>
                    </View>
                    <View style={styles.messageMeta}>
                      <Text style={styles.messageTime}>{lastMessage ? formatMessageTime(lastMessage.sentAt) : ''}</Text>
                      <Icon source={icons.chevronRight} size={18} color="#8790a7" />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <>
              <Pressable style={styles.chatBackRow} onPress={() => onSelectChild?.(null)} disabled={isSending}>
                <Icon source={icons.chevronRight} size={18} color="#0065ff" />
                <Text style={styles.chatBackText}>Sva djeca</Text>
              </Pressable>
              <Text style={styles.chatTitle}>{selectedChild.childName}</Text>

              <ScrollView style={styles.chatMessagesList} showsVerticalScrollIndicator={false}>
                {conversationMessages.length === 0 ? (
                  <View style={styles.chatEmptyBox}>
                    <Text style={styles.childrenStateText}>Još nema poruka u ovom razgovoru.</Text>
                  </View>
                ) : (
                  conversationMessages.map((message) => {
                    const isMine = sameId(message.senderId, currentUserId);

                    return (
                      <View key={message.id} style={[styles.chatBubble, isMine ? styles.chatBubbleMine : styles.chatBubbleTheirs]}>
                        <Text style={[styles.chatBubbleText, isMine && styles.chatBubbleTextMine]}>{message.content}</Text>
                        <Text style={[styles.chatBubbleTime, isMine && styles.chatBubbleTimeMine]}>{formatMessageTime(message.sentAt)}</Text>
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
                  {isSending ? <ActivityIndicator color="#ffffff" /> : <Icon source={icons.send} size={22} color="#ffffff" />}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function NotificationsModal({ visible, notifications, onClose, onNotificationPress }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.notificationsModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Notifikacije</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.childrenStateBox}>
              <Text style={styles.childrenStateText}>Trenutno nema novih notifikacija.</Text>
            </View>
          ) : (
            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              {notifications.map((notification) => (
                <Pressable key={notification.id} style={styles.notificationRow} onPress={() => onNotificationPress?.(notification)}>
                  <View style={styles.notificationTypePill}>
                    <Text style={styles.notificationTypeText}>{notification.type}</Text>
                  </View>
                  <View style={styles.notificationBody}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationText}>{notification.text}</Text>
                    <Text style={styles.notificationTime}>{formatMessageTime(notification.date)}</Text>
                  </View>
                  <Icon source={icons.chevronRight} size={18} color="#8790a7" />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ChildrenContent({ children, error, isLoading, onChildPress }) {
  if (isLoading) {
    return (
      <View style={styles.childrenStateBox}>
        <ActivityIndicator color="#0065ff" />
        <Text style={styles.childrenStateText}>Učitavanje djece...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.childrenStateBox}>
        <Text style={styles.childrenErrorText}>{error}</Text>
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <View style={styles.childrenStateBox}>
        <Text style={styles.childrenStateTitle}>Još nema dodane djece.</Text>
        <Text style={styles.childrenStateText}>Dodajte prvo dijete kako biste mu mogli dodijeliti zadatke i nagrade.</Text>
      </View>
    );
  }

  return (
    <View style={styles.childrenList}>
      {children.map((child, index) => (
        <Pressable key={child.id} style={styles.childRow} onPress={() => onChildPress?.(child.id)}>
          <Image source={getChildAvatarSource(child.childAvatarKey, index)} style={styles.childAvatar} />
          <View style={styles.childTextBox}>
            <Text style={styles.childName}>{child.childName}</Text>
            {child.childEmail ? <Text style={styles.childEmail}>{child.childEmail}</Text> : null}
          </View>
          <Icon source={icons.chevronRight} size={22} color="#44506a" />
        </Pressable>
      ))}
    </View>
  );
}

function SectionCard({ title, icon, image, actionText, actionColor, accentColor = '#0065ff', onActionPress, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          {image ? <Image source={image} style={styles.sectionTitleImage} resizeMode="contain" /> : <Icon source={icon} size={34} color={accentColor} />}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Pressable style={styles.sectionAction} onPress={onActionPress}>
          <Text style={[styles.sectionActionText, { color: actionColor }]}>{actionText}</Text>
          <Icon source={icons.chevronRight} size={18} color={actionColor} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function StatsPanel({ children, tinted }) {
  return <View style={[styles.statsPanel, tinted && styles.greenStatsPanel]}>{children}</View>;
}

function StatsContent({ isLoading, error, loadingText, children }) {
  if (isLoading) {
    return (
      <View style={styles.statsStateBox}>
        <ActivityIndicator color="#0065ff" />
        <Text style={styles.childrenStateText}>{loadingText}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.statsStateBox}>
        <Text style={styles.childrenErrorText}>{error}</Text>
      </View>
    );
  }

  return children;
}

function StatsDetailsModal({ visible, title, color, stats, highlight, hint, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.statsModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={[styles.statsHighlight, { borderColor: color }]}>
            <Text style={[styles.statsHighlightText, { color }]}>{highlight}</Text>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statsDetailCard}>
                {stat.image ? <Image source={stat.image} style={styles.statsDetailImage} resizeMode="contain" /> : <Icon source={stat.icon} size={30} color={color} />}
                <Text style={styles.statsDetailValue}>{stat.value}</Text>
                <Text style={styles.statsDetailLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.statsHint}>{hint}</Text>
        </View>
      </View>
    </Modal>
  );
}

function StatItem({ icon, image, value, label, color }) {
  return (
    <View style={styles.statItem}>
      {image ? <Image source={image} style={styles.statImage} resizeMode="contain" /> : <Icon source={icon} size={42} color={color} />}
      <View style={styles.statTextBox}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function DashedButton({ label, icon, color, onPress }) {
  return (
    <Pressable style={[styles.dashedButton, { borderColor: color }]} onPress={onPress}>
      <Icon source={icon} size={25} color={color} />
      <Text style={[styles.dashedButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function BottomNavigation({ onNavigateHome, onNavigateChildren, onNavigateRewards, onNavigateMessages, onNavigateProfile }) {
  const items = [
    { label: 'Početna', icon: icons.home, active: true, onPress: onNavigateHome },
    { label: 'Djeca', icon: icons.user, onPress: onNavigateChildren },
    { label: 'Nagrade', icon: icons.gift, onPress: onNavigateRewards },
    { label: 'Poruke', icon: icons.chat, onPress: onNavigateMessages },
    { label: 'Profil', icon: icons.profile, onPress: onNavigateProfile },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => (
        <Pressable key={item.label} style={styles.navItem} onPress={() => item.onPress?.()}>
          <Icon source={item.icon} size={28} color={item.active ? '#0065ff' : '#46536c'} />
          <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Icon({ source, size, color }) {
  return <Image source={source} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />;
}

function isTaskStatus(status, numericValue, textValue) {
  return Number(status) === numericValue || status === textValue;
}

function isRewardSuggestionStatus(status, numericValue, textValue) {
  return Number(status) === numericValue || status === textValue;
}

function isRewardRequestStatus(status, numericValue, textValue) {
  return Number(status) === numericValue || status === textValue;
}

function sameId(firstId, secondId) {
  return firstId != null && secondId != null && Number(firstId) === Number(secondId);
}

function getChildUserId(child) {
  return child?.childId ?? child?.userId ?? child?.id;
}

function getChildStatExtreme(results, direction) {
  if (results.length === 0) {
    return null;
  }

  return results.reduce((selected, current) => {
    if (direction === 'max') {
      return current.count > selected.count ? current : selected;
    }

    return current.count < selected.count ? current : selected;
  }, results[0]);
}

function formatChildStat(result, suffix) {
  if (!result) {
    return '-';
  }

  return `${result.name}: ${result.count} ${suffix}`;
}

function formatMessageTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' });
}

function isConversationMessage(message, firstUserId, secondUserId) {
  return (sameId(message.senderId, firstUserId) && sameId(message.receiverId, secondUserId))
    || (sameId(message.senderId, secondUserId) && sameId(message.receiverId, firstUserId));
}

function getLastConversationMessage(messages, firstUserId, secondUserId) {
  return messages
    .filter((message) => isConversationMessage(message, firstUserId, secondUserId))
    .filter((message) => !isSystemNotificationMessage(message))
    .sort((first, second) => new Date(second.sentAt) - new Date(first.sentAt))[0];
}

function isUnreadConversation(lastMessage, currentUserId, readChildIds, childId) {
  return Boolean(lastMessage)
    && !sameId(lastMessage.senderId, currentUserId)
    && !readChildIds.some((readChildId) => sameId(readChildId, childId));
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

function getConversationPeerId(message, currentUserId) {
  return sameId(message.senderId, currentUserId) ? message.receiverId : message.senderId;
}

function getMessageSenderName(message, user, children) {
  if (sameId(message.senderId, user?.id ?? user?.userId)) {
    return user?.name || 'Vi';
  }

  return getChildNameById(children, message.senderId);
}

function getMessageSenderInitial(message, user, children) {
  return getMessageSenderName(message, user, children).trim().charAt(0).toUpperCase() || '!';
}

function formatShortDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getChildNameById(children, childId) {
  return children.find((child) => sameId(getChildUserId(child), childId))?.childName ?? 'Dijete';
}

function getTaskPoints(task) {
  return Number(task?.points) || 0;
}

function getRewardPoints(reward) {
  return Number(reward?.requiredPoints ?? reward?.points) || 0;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#edf5ff' },
  screen: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerTextBox: { flex: 1, paddingRight: 12 },
  welcomeText: { color: '#4c5877', fontSize: 18, marginBottom: 6 },
  userName: { color: '#061e60', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subText: { color: '#4c5877', fontSize: 17, marginTop: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: 1, top: 2, minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#ff3d32', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  badgeText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  parentAvatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#dfe5ff' },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 15, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e4ebf6', shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitleImage: { width: 36, height: 36 },
  sectionTitle: { color: '#071e60', fontSize: 21, fontWeight: '800' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontSize: 14, fontWeight: '600' },
  childrenList: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  childRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e8eef7' },
  childAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#dcecff' },
  childTextBox: { flex: 1, marginLeft: 16 },
  childName: { color: '#071e60', fontSize: 18, fontWeight: '700' },
  childEmail: { color: '#6a748c', fontSize: 12, marginTop: 3 },
  childrenStateBox: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18, marginBottom: 12, alignItems: 'center' },
  childrenStateTitle: { color: '#071e60', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  childrenStateText: { color: '#4c5877', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  childrenErrorText: { color: '#a32929', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  dashedButton: { height: 48, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  dashedButtonText: { fontSize: 17, fontWeight: '700' },
  statsPanel: { minHeight: 88, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, backgroundColor: '#ffffff' },
  greenStatsPanel: { backgroundColor: '#fbfffd', borderColor: '#d7f1e5' },
  statsStateBox: { minHeight: 88, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#e0e8f4' },
  statImage: { width: 44, height: 44 },
  statTextBox: { alignItems: 'center', marginTop: 4 },
  statValue: { color: '#071e60', fontSize: 23, fontWeight: '800', lineHeight: 28 },
  statLabel: { color: '#4c5877', fontSize: 12, textAlign: 'center', marginTop: 3 },
  suggestionList: { borderWidth: 1, borderColor: '#ffe2bf', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fffaf4' },
  suggestionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#ffe8cd' },
  suggestionIconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  suggestionIcon: { width: 42, height: 42 },
  suggestionBody: { flex: 1, paddingRight: 10 },
  suggestionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  suggestionName: { color: '#071e60', fontSize: 16, fontWeight: '900' },
  suggestionMeta: { color: '#6a748c', fontSize: 12, fontWeight: '700', marginTop: 5 },
  newPill: { borderRadius: 999, backgroundColor: '#ff3d32', paddingHorizontal: 8, paddingVertical: 3 },
  newPillText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  suggestionAlertCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff3d9', borderWidth: 1, borderColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  suggestionAlertText: { color: '#f97316', fontSize: 20, fontWeight: '900' },
  messageList: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  messageStateBox: { minHeight: 72, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  messageRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e8eef7' },
  messageRowUnread: { backgroundColor: '#eef6ff' },
  messageAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  messageInitial: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  messageBody: { flex: 1, paddingRight: 8 },
  messageSenderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  messageSender: { color: '#071e60', fontSize: 14, fontWeight: '800', marginBottom: 3 },
  messageSenderUnread: { color: '#004ecb', fontWeight: '900' },
  messageText: { color: '#4c5877', fontSize: 13, lineHeight: 18 },
  messageTextUnread: { color: '#071e60', fontWeight: '800' },
  messageMeta: { alignItems: 'flex-end', gap: 8 },
  messageTime: { color: '#8790a7', fontSize: 12 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0065ff' },
  unreadPill: { borderRadius: 999, backgroundColor: '#0065ff', paddingHorizontal: 7, paddingVertical: 3 },
  unreadPillText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.42)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  statsModalCard: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  reviewModalCard: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  messagesModalCard: { width: '100%', maxWidth: 410, height: '78%', borderRadius: 18, backgroundColor: '#ffffff', padding: 18, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  notificationsModalCard: { width: '100%', maxWidth: 390, maxHeight: '78%', borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { color: '#071e60', fontSize: 24, fontWeight: '800' },
  modalClose: { color: '#536079', fontSize: 34, lineHeight: 34, fontWeight: '300' },
  statsHighlight: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#f8fbff', marginBottom: 14 },
  statsHighlightText: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statsDetailCard: { width: '48%', minHeight: 104, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: '#ffffff' },
  statsDetailImage: { width: 34, height: 34 },
  statsDetailValue: { color: '#071e60', fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  statsDetailLabel: { color: '#4c5877', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  statsHint: { color: '#4c5877', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 14 },
  reviewHero: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 14, backgroundColor: '#fbfdff' },
  reviewIconBox: { width: 70, height: 70, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  reviewIcon: { width: 54, height: 54 },
  reviewHeroText: { flex: 1 },
  reviewName: { color: '#071e60', fontSize: 21, fontWeight: '900', marginBottom: 6 },
  reviewMeta: { color: '#4c5877', fontSize: 13, fontWeight: '700', marginTop: 3 },
  reviewInputLabel: { color: '#071e60', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  reviewInput: { minHeight: 52, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 13, paddingHorizontal: 14, color: '#071e60', fontSize: 17, fontWeight: '800', backgroundColor: '#fbfdff', marginBottom: 14 },
  reviewTimeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  reviewTimeOption: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: '#dce3ef', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  reviewTimeOptionSelected: { borderColor: '#10a96b', backgroundColor: '#effced' },
  reviewTimeText: { color: '#52607b', fontSize: 13, fontWeight: '800' },
  reviewTimeTextSelected: { color: '#0c8c51' },
  reviewEditedDate: { color: '#64708b', fontSize: 13, fontWeight: '700', marginBottom: 14 },
  completionImageBlock: { marginBottom: 14 },
  completionImage: { width: '100%', height: 210, borderRadius: 14, backgroundColor: '#eef4ff' },
  noCompletionImageBox: { minHeight: 120, borderRadius: 14, borderWidth: 1, borderColor: '#e0e8f4', backgroundColor: '#fbfdff', alignItems: 'center', justifyContent: 'center', padding: 16 },
  noCompletionImageText: { color: '#6a748c', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
  modalHint: { color: '#6a748c', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
  reviewActionsRow: { flexDirection: 'row', gap: 12 },
  rejectButton: { flex: 1, minHeight: 52, borderRadius: 13, borderWidth: 1.5, borderColor: '#ff3d32', backgroundColor: '#fff5f4', alignItems: 'center', justifyContent: 'center' },
  rejectButtonText: { color: '#c7362f', fontSize: 16, fontWeight: '900' },
  approveButton: { flex: 1, minHeight: 52, borderRadius: 13, backgroundColor: '#10a96b', alignItems: 'center', justifyContent: 'center' },
  approveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  disabledButton: { opacity: 0.65 },
  notificationsList: { maxHeight: 430 },
  notificationRow: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 13, padding: 12, marginBottom: 10, flexDirection: 'row', backgroundColor: '#fbfdff' },
  notificationTypePill: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#eaf2ff', paddingHorizontal: 9, paddingVertical: 5, marginRight: 10 },
  notificationTypeText: { color: '#0065ff', fontSize: 11, fontWeight: '900' },
  notificationBody: { flex: 1 },
  notificationTitle: { color: '#071e60', fontSize: 15, fontWeight: '900' },
  notificationText: { color: '#4c5877', fontSize: 13, lineHeight: 18, marginTop: 4 },
  notificationTime: { color: '#8790a7', fontSize: 12, marginTop: 6 },
  chatContactList: { flex: 1 },
  chatContactRow: { minHeight: 72, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fbfdff' },
  chatBackRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, transform: [{ rotate: '180deg' }] },
  chatBackText: { color: '#0065ff', fontSize: 13, fontWeight: '900', transform: [{ rotate: '180deg' }] },
  chatTitle: { color: '#071e60', fontSize: 19, fontWeight: '900', marginBottom: 10 },
  chatChildSelector: { gap: 8, paddingBottom: 10 },
  chatChildPill: { borderRadius: 999, borderWidth: 1, borderColor: '#d9e5f5', backgroundColor: '#f7fbff', paddingHorizontal: 14, paddingVertical: 9 },
  chatChildPillActive: { borderColor: '#0065ff', backgroundColor: '#eaf2ff' },
  chatChildPillText: { color: '#52607b', fontSize: 13, fontWeight: '800' },
  chatChildPillTextActive: { color: '#0065ff' },
  chatMessagesList: { flex: 1, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, backgroundColor: '#fbfdff', padding: 10, marginBottom: 12 },
  chatEmptyBox: { minHeight: 180, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  chatBubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 9 },
  chatBubbleMine: { alignSelf: 'flex-end', backgroundColor: '#0065ff', borderBottomRightRadius: 5 },
  chatBubbleTheirs: { alignSelf: 'flex-start', backgroundColor: '#eef4ff', borderBottomLeftRadius: 5 },
  chatBubbleText: { color: '#071e60', fontSize: 14, lineHeight: 19, fontWeight: '700' },
  chatBubbleTextMine: { color: '#ffffff' },
  chatBubbleTime: { color: '#8790a7', fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'right' },
  chatBubbleTimeMine: { color: '#dceaff' },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatInput: { flex: 1, minHeight: 48, maxHeight: 96, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, color: '#071e60', fontSize: 15, fontWeight: '700', backgroundColor: '#fbfdff' },
  chatSendButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#0065ff', alignItems: 'center', justifyContent: 'center' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 82, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#e6edf7', backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 8 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
  navLabel: { color: '#46536c', fontSize: 12, marginTop: 4, fontWeight: '600' },
  navLabelActive: { color: '#0065ff' },
});
