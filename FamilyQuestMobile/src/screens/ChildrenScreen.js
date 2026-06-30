import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddRewardModal } from '../components/AddRewardModal';
import { AddTaskModal } from '../components/AddTaskModal';
import { getMyChildren } from '../services/childrenService';
import { getRewardRequests, REWARD_REQUEST_STATUSES, updateRewardRequestStatus } from '../services/rewardRequestService';
import { createReward, getRewards, updateReward } from '../services/rewardService';
import { getRewardSuggestions, REWARD_SUGGESTION_STATUSES, updateRewardSuggestionStatus } from '../services/rewardSuggestionService';
import { createTask, getTasks, TASK_STATUSES, updateTaskStatus } from '../services/taskService';
import { updateChildProfile } from '../services/profileService';
import { childAvatarOptions, getChildAvatarSource } from '../utils/childAvatars';
import { getParentAvatarSource } from '../utils/parentAvatars';

const icons = {
  bell: require('../../assets/home-icons/bell.png'),
  chevronRight: require('../../assets/home-icons/chevron-right.png'),
  checkCircle: require('../../assets/home-icons/check-circle.png'),
  clipboard: require('../../assets/home-icons/clipboard.png'),
  gift: require('../../assets/home-icons/gift.png'),
  home: require('../../assets/home-icons/home.png'),
  pencil: require('../../assets/home-icons/pencil.png'),
  plusCircle: require('../../assets/home-icons/plus-circle.png'),
  profile: require('../../assets/home-icons/profile.png'),
  star: require('../../assets/child-home/star.png'),
  user: require('../../assets/home-icons/user.png'),
};

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

const rewardReviewTimeOptions = [
  { label: 'Predloženo', offsetDays: null },
  { label: 'Danas', offsetDays: 0 },
  { label: 'Sutra', offsetDays: 1 },
  { label: 'Za 3 dana', offsetDays: 3 },
  { label: 'Za 7 dana', offsetDays: 7 },
  { label: 'Za 14 dana', offsetDays: 14 },
  { label: 'Za 30 dana', offsetDays: 30 },
];

const rewardEditTimeOptions = [
  { label: 'Zadrži rok', offsetDays: null },
  { label: 'Danas', offsetDays: 0 },
  { label: 'Sutra', offsetDays: 1 },
  { label: 'Za 3 dana', offsetDays: 3 },
  { label: 'Za 7 dana', offsetDays: 7 },
  { label: 'Za 14 dana', offsetDays: 14 },
  { label: 'Za 30 dana', offsetDays: 30 },
];

const rewardIconOptions = [
  { key: 'gamepad', label: 'Igra', source: require('../../assets/reward-items/gamepad.png'), color: '#eee4ff' },
  { key: 'ice-cream', label: 'Sladoled', source: require('../../assets/reward-items/ice-cream.png'), color: '#ffdce8' },
  { key: 'travel-car', label: 'Izlet', source: require('../../assets/reward-items/travel-car.png'), color: '#e7f8d9' },
  { key: 'picnic', label: 'Piknik', source: require('../../assets/reward-items/picnic.png'), color: '#fff0ba' },
  { key: 'shopping-bag', label: 'Kupovina', source: require('../../assets/reward-items/shopping-bag.png'), color: '#e8f2ff' },
  { key: 'suitcase', label: 'Putovanje', source: require('../../assets/reward-items/suitcase.png'), color: '#f0ecff' },
];

export function ChildrenScreen({
  token,
  user,
  initialSelectedChildId,
  onBack,
  onNavigateToAddChild,
  onNavigateHome,
  onNavigateToProfile,
  onNavigateToMessages,
  openRewardsOnStart,
  onRewardsOpened,
}) {
  const insets = useSafeAreaInsets();
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAddTaskVisible, setIsAddTaskVisible] = useState(false);
  const [isTasksListVisible, setIsTasksListVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isAddRewardVisible, setIsAddRewardVisible] = useState(false);
  const [isRewardsListVisible, setIsRewardsListVisible] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [rewardsError, setRewardsError] = useState('');
  const [rewardRequests, setRewardRequests] = useState([]);
  const [rewardSuggestions, setRewardSuggestions] = useState([]);
  const [isLoadingRewardSuggestions, setIsLoadingRewardSuggestions] = useState(false);
  const [rewardSuggestionsError, setRewardSuggestionsError] = useState('');
  const [selectedRewardSuggestion, setSelectedRewardSuggestion] = useState(null);
  const [selectedRewardRequest, setSelectedRewardRequest] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [reviewingSuggestionId, setReviewingSuggestionId] = useState(null);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [isUpdatingReward, setIsUpdatingReward] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [selectedChildProfile, setSelectedChildProfile] = useState(null);
  const [isUpdatingChildProfile, setIsUpdatingChildProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadChildren = async () => {
      if (!token) {
        setErrorMessage('Niste prijavljeni. Molimo prijavite se ponovo.');
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await getMyChildren({ token });
        if (!isMounted) {
          return;
        }

        setChildren(response);
        setSelectedChildId((current) => current ?? initialSelectedChildId ?? response[0]?.id ?? null);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Učitavanje djece nije uspjelo.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadChildren();

    return () => {
      isMounted = false;
    };
  }, [token, initialSelectedChildId]);

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
          setRewardSuggestionsError(error.message || 'Učitavanje prijedloga nagrada nije uspjelo.');
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
    if (openRewardsOnStart) {
      setIsRewardsListVisible(true);
      onRewardsOpened?.();
    }
  }, [openRewardsOnStart, onRewardsOpened]);

  const selectedChild = useMemo(
    () => children.find((child) => sameId(child.id, selectedChildId) || sameId(child.childId, selectedChildId)) ?? children[0],
    [children, selectedChildId],
  );

  const selectedIndex = Math.max(0, children.findIndex((child) => child.id === selectedChild?.id));

  const visibleAssignedTasks = useMemo(() => {
    if (!selectedChild) {
      return [];
    }

    const selectedChildUserId = getChildUserId(selectedChild);

    return tasks
      .filter((task) => sameId(task.childId, selectedChildUserId))
      .map((task) => {
        const taskIcon = taskIconSources[task.iconKey ?? task.taskIcon] ?? taskIconSources.notebook;

        return {
          ...task,
          title: task.name,
          image: taskIcon.image,
          color: taskIcon.color,
          statusLabel: getTaskStatusLabel(task.status),
        };
      });
  }, [selectedChild, tasks]);

  const approvedPoints = useMemo(
    () => getAvailablePointsForChild(visibleAssignedTasks, rewardRequests, selectedChild ? getChildUserId(selectedChild) : null, rewards),
    [rewardRequests, rewards, selectedChild, visibleAssignedTasks],
  );

  const visibleRewards = useMemo(() => {
    if (!selectedChild) {
      return [];
    }

    const selectedChildUserId = getChildUserId(selectedChild);

    return rewards
      .filter((reward) => sameId(reward.childId, selectedChildUserId))
      .map((reward) => {
        const rewardIcon = rewardIconSources[reward.iconKey ?? reward.rewardIcon] ?? rewardIconSources.gamepad;

        return {
          ...reward,
          title: reward.name,
          points: reward.requiredPoints,
          image: rewardIcon.image,
          color: rewardIcon.color,
        };
      });
  }, [selectedChild, rewards]);

  const visiblePendingRewardSuggestions = useMemo(() => {
    if (!selectedChild) {
      return [];
    }

    const selectedChildUserId = getChildUserId(selectedChild);

    return rewardSuggestions
      .filter((suggestion) => sameId(suggestion.childId, selectedChildUserId)
        && isRewardSuggestionStatus(suggestion.status, REWARD_SUGGESTION_STATUSES.pending, 'Pending'))
      .map((suggestion) => {
        const rewardIcon = rewardIconSources[suggestion.iconKey] ?? rewardIconSources.gamepad;

        return {
          ...suggestion,
          title: suggestion.name,
          image: rewardIcon.image,
          color: rewardIcon.color,
        };
      });
  }, [rewardSuggestions, selectedChild]);

  const visiblePendingRewardRequests = useMemo(() => {
    if (!selectedChild) {
      return [];
    }

    const selectedChildUserId = getChildUserId(selectedChild);

    return rewardRequests.filter((request) => sameId(request.childId, selectedChildUserId)
      && isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.pending, 'Pending'));
  }, [rewardRequests, selectedChild]);

  const notifications = useMemo(() => {
    const taskNotifications = visibleAssignedTasks
      .filter((task) => isTaskStatus(task.status, TASK_STATUSES.pendingApproval, 'PendingApproval'))
      .map((task) => ({
        id: `task-${task.id}`,
        type: 'Zadatak',
        title: 'Zadatak čeka odobrenje',
        text: `${selectedChild?.childName ?? 'Dijete'} je poslalo dokaz za "${task.title}".`,
        date: task.submittedAt ?? task.dueDate,
        actionType: 'task',
        payload: task,
      }));

    const suggestionNotifications = visiblePendingRewardSuggestions.map((suggestion) => ({
      id: `suggestion-${suggestion.id}`,
      type: 'Prijedlog',
      title: 'Nova predložena nagrada',
      text: `${selectedChild?.childName ?? 'Dijete'} predlaže "${suggestion.title}".`,
      date: suggestion.suggestedAt,
      actionType: 'suggestion',
      payload: suggestion,
    }));

    const requestNotifications = visiblePendingRewardRequests.map((request) => {
      const reward = visibleRewards.find((currentReward) => sameId(currentReward.id, request.rewardId));

      return {
        id: `reward-request-${request.id}`,
        type: 'Nagrada',
        title: 'Nagrada je zatražena',
        text: `${selectedChild?.childName ?? 'Dijete'} je zatražilo "${reward?.title || 'nagradu'}".`,
        date: request.requestDate,
        actionType: 'rewardRequest',
        payload: request,
      };
    });

    return [...taskNotifications, ...suggestionNotifications, ...requestNotifications]
      .sort((first, second) => new Date(second.date ?? 0) - new Date(first.date ?? 0));
  }, [selectedChild, visibleAssignedTasks, visiblePendingRewardRequests, visiblePendingRewardSuggestions, visibleRewards]);

  const handleCreateTask = async (taskPayload) => {
    if (!token) {
      throw new Error('Morate biti prijavljeni da biste dodali zadatak.');
    }

    const createdTask = await createTask({ token, task: taskPayload });
    setTasks((currentTasks) => [createdTask, ...currentTasks]);
  };

  const handleCreateReward = async (rewardPayload) => {
    if (!token) {
      throw new Error('Morate biti prijavljeni da biste dodali nagradu.');
    }

    const createdReward = await createReward({ token, reward: rewardPayload });
    setRewards((currentRewards) => [createdReward, ...currentRewards]);
  };

  const handleUpdateReward = async (rewardPayload) => {
    if (!token || !selectedReward) {
      return;
    }

    setIsUpdatingReward(true);
    setRewardsError('');

    try {
      const updatedReward = await updateReward({
        token,
        rewardId: selectedReward.id,
        reward: rewardPayload,
      });

      setRewards((currentRewards) => currentRewards.map((currentReward) => (
        currentReward.id === selectedReward.id ? updatedReward : currentReward
      )));
      setSelectedReward(null);
      Alert.alert('Nagrada izmijenjena', 'Promjene su sačuvane.');
    } catch (error) {
      Alert.alert('Greška', error.message || 'Izmjena nagrade nije uspjela.');
    } finally {
      setIsUpdatingReward(false);
    }
  };

  const handleReviewRewardSuggestion = async ({ suggestion, status, requiredPoints, dueDate }) => {
    if (!token) {
      return;
    }

    setReviewingSuggestionId(suggestion.id);
    setRewardSuggestionsError('');

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

  const handleReviewRewardRequest = async ({ request, status }) => {
    if (!token || !request) {
      return;
    }

    setReviewingRequestId(request.id);
    setRewardsError('');

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


  const handleUpdateTaskStatus = async (status) => {
    if (!token || !selectedTask) {
      return;
    }

    setIsUpdatingTask(true);
    setTasksError('');

    try {
      await updateTaskStatus({ token, taskId: selectedTask.id, status });
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === selectedTask.id ? { ...task, status } : task
      )));
      setSelectedTask(null);
    } catch (error) {
      setTasksError(error.message || 'Ažuriranje statusa zadatka nije uspjelo.');
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleUpdateChildProfile = async ({ child, avatarKey, newPassword }) => {
    if (!token || !child) {
      return;
    }

    setIsUpdatingChildProfile(true);

    try {
      const updatedChild = await updateChildProfile({
        token,
        childId: getChildUserId(child),
        avatarKey,
        newPassword,
      });

      setChildren((currentChildren) => currentChildren.map((currentChild) => (
        sameId(getChildUserId(currentChild), updatedChild.childId) ? updatedChild : currentChild
      )));
      setSelectedChildProfile(null);
      Alert.alert('Profil djeteta je sačuvan', 'Promjene su uspješno sačuvane.');
    } catch (error) {
      Alert.alert('Greška', error.message || 'Spremanje profila djeteta nije uspjelo.');
    } finally {
      setIsUpdatingChildProfile(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable style={styles.backRow} onPress={onBack} hitSlop={12}>
              <Image source={icons.chevronRight} style={styles.backIcon} resizeMode="contain" />
              <Text style={styles.headerTitle}>Moja djeca</Text>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable style={styles.bellButton} onPress={() => setIsNotificationsVisible(true)}>
                <Icon source={icons.bell} size={31} color="#44506a" />
                {notifications.length > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notifications.length > 99 ? '99+' : notifications.length}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Image source={getParentAvatarSource(user?.avatarKey)} style={styles.parentAvatar} />
            </View>
          </View>

          <Text style={styles.sectionEyebrow}>Odabrano dijete</Text>

          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#0065ff" />
              <Text style={styles.stateText}>Učitavanje djece...</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {!isLoading && !errorMessage && children.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Još nema dodane djece.</Text>
              <Text style={styles.emptyText}>Dodajte prvo dijete kako biste mogli pratiti zadatke, bodove i nagrade.</Text>
              <Pressable style={styles.emptyButton} onPress={onNavigateToAddChild}>
                <Icon source={icons.plusCircle} size={24} color="#ffffff" />
                <Text style={styles.emptyButtonText}>Dodaj dijete</Text>
              </Pressable>
            </View>
          ) : null}

          {children.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childrenSelector}>
                {children.map((child, index) => {
                  const isSelected = child.id === selectedChild?.id;
                  return (
                    <Pressable
                      key={child.id}
                      style={[styles.childSelectCard, isSelected && styles.childSelectCardActive]}
                      onPress={() => setSelectedChildId(child.id)}
                    >
                      <Image source={getChildAvatarSource(child.childAvatarKey, index)} style={styles.selectorAvatar} />
                      <View style={styles.selectorTextBox}>
                        <Text style={styles.selectorName}>{child.childName}</Text>
                        <Text style={styles.selectorPoints}>{getAvailablePointsForChild(tasks, rewardRequests, getChildUserId(child), rewards)} bodova</Text>
                      </View>
                      <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                        {isSelected ? <Icon source={icons.checkCircle} size={26} color="#ffffff" /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.heroPanel}>
                <View style={styles.heroAvatarBox}>
                  <Image source={getChildAvatarSource(selectedChild.childAvatarKey, selectedIndex)} style={styles.heroAvatar} />
                </View>
                <View style={styles.heroInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.heroName}>{selectedChild.childName}</Text>
                    <Pressable style={styles.editButton} onPress={() => setSelectedChildProfile(selectedChild)} hitSlop={10}>
                      <Icon source={icons.pencil} size={19} color="#0065ff" />
                    </Pressable>
                  </View>
                  <Text style={styles.pointsLabel}>Ukupni bodovi</Text>
                  <View style={styles.pointsRow}>
                    <Text style={styles.pointsValue}>{approvedPoints}</Text>
                    <Icon source={icons.star} size={34} color="#ffc20e" />
                  </View>
                </View>
                <View style={styles.heroActions}>
                  <ActionButton label="Dodaj zadatak" icon={icons.clipboard} color="#0065ff" onPress={() => setIsAddTaskVisible(true)} />
                  <ActionButton label="Dodaj nagradu" icon={icons.gift} color="#0ca85d" green onPress={() => setIsAddRewardVisible(true)} />
                </View>
              </View>

              <Card
                title="Dodijeljeni zadaci"
                icon={icons.clipboard}
                color="#0065ff"
                actionText="Pogledaj sve"
                onActionPress={() => setIsTasksListVisible(true)}
              >
                {isLoadingTasks ? (
                  <View style={styles.taskStateBox}>
                    <ActivityIndicator color="#0065ff" />
                    <Text style={styles.stateText}>Učitavanje zadataka...</Text>
                  </View>
                ) : null}

                {tasksError ? <Text style={styles.taskErrorText}>{tasksError}</Text> : null}

                {!isLoadingTasks && visibleAssignedTasks.length === 0 ? (
                  <View style={styles.taskStateBox}>
                    <Text style={styles.emptyTitle}>Nema dodijeljenih zadataka.</Text>
                    <Text style={styles.emptyText}>Dodajte zadatak kako bi se prikazao na kartici djeteta.</Text>
                  </View>
                ) : null}

                {visibleAssignedTasks.length > 0 ? (
                  <View style={styles.taskList}>
                    {visibleAssignedTasks.map((task) => (
                      <Pressable key={task.id} style={styles.taskRow} onPress={() => setSelectedTask(task)}>
                        <View style={[styles.taskImageBox, { backgroundColor: task.color }]}> 
                          <Image source={task.image} style={styles.taskImage} resizeMode="contain" />
                        </View>
                        <View style={styles.taskBody}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <View style={styles.taskPointsRow}>
                            <Icon source={icons.star} size={17} color="#ffc20e" />
                            <Text style={styles.taskPoints}>{getTaskPoints(task)} bodova</Text>
                          </View>
                        </View>
                        <StatusPill status={task.status} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </Card>

              <Card
                title="Predložene nagrade"
                icon={icons.gift}
                color="#ff354d"
                actionText="Pogledaj sve"
                onActionPress={() => setIsRewardsListVisible(true)}
              >
                {isLoadingRewards || isLoadingRewardSuggestions ? (
                  <View style={styles.taskStateBox}>
                    <ActivityIndicator color="#0ca85d" />
                    <Text style={styles.stateText}>Učitavanje nagrada...</Text>
                  </View>
                ) : null}

                {rewardsError ? <Text style={styles.taskErrorText}>{rewardsError}</Text> : null}
                {rewardSuggestionsError ? <Text style={styles.taskErrorText}>{rewardSuggestionsError}</Text> : null}

                {!isLoadingRewards && !isLoadingRewardSuggestions && visibleRewards.length === 0 && visiblePendingRewardSuggestions.length === 0 ? (
                  <View style={styles.taskStateBox}>
                    <Text style={styles.emptyTitle}>Nema dodanih nagrada.</Text>
                    <Text style={styles.emptyText}>Dodajte nagradu kako bi se prikazala na kartici djeteta.</Text>
                  </View>
                ) : null}

                {visibleRewards.length > 0 || visiblePendingRewardSuggestions.length > 0 ? (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsRow}>
                      {visiblePendingRewardSuggestions.map((suggestion) => (
                        <RewardSuggestionCard
                          key={`suggestion-${suggestion.id}`}
                          suggestion={suggestion}
                          onPress={() => setSelectedRewardSuggestion(suggestion)}
                        />
                      ))}
                      {visibleRewards.map((reward) => (
                        <View key={reward.id} style={[styles.rewardCard, { backgroundColor: reward.color }]}>
                          <Image source={reward.image} style={styles.rewardImage} resizeMode="contain" />
                          <Text style={styles.rewardTitle}>{reward.title}</Text>
                          <View style={styles.rewardPointsRow}>
                            <Icon source={icons.star} size={17} color="#ffc20e" />
                            <Text style={styles.rewardPoints}>{getRewardPoints(reward)} bodova</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                    <View style={styles.dotsRow}>
                      <View style={styles.dotActive} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                    </View>
                  </>
                ) : null}
              </Card>
            </>
          ) : null}
        </ScrollView>

        <BottomNavigation
          bottomInset={insets.bottom}
          onNavigateHome={onNavigateHome}
          onNavigateChildren={() => {}}
          onNavigateRewards={() => setIsRewardsListVisible(true)}
          onNavigateMessages={onNavigateToMessages}
          onNavigateProfile={onNavigateToProfile}
        />
        <TaskDetailsModal
          task={selectedTask}
          isUpdating={isUpdatingTask}
          onClose={() => setSelectedTask(null)}
          onApprove={() => handleUpdateTaskStatus(TASK_STATUSES.approved)}
          onReject={() => handleUpdateTaskStatus(TASK_STATUSES.rejected)}
        />
        <TasksListModal
          visible={isTasksListVisible}
          tasks={visibleAssignedTasks}
          isLoading={isLoadingTasks}
          errorMessage={tasksError}
          onClose={() => setIsTasksListVisible(false)}
          onTaskPress={(task) => {
            setIsTasksListVisible(false);
            setSelectedTask(task);
          }}
        />
        <AddTaskModal
          visible={isAddTaskVisible}
          child={selectedChild}
          onClose={() => setIsAddTaskVisible(false)}
          onSubmit={handleCreateTask}
        />
        <AddRewardModal
          visible={isAddRewardVisible}
          child={selectedChild}
          onClose={() => setIsAddRewardVisible(false)}
          onSubmit={handleCreateReward}
        />
        <RewardsListModal
          visible={isRewardsListVisible}
          rewards={visibleRewards}
          suggestions={visiblePendingRewardSuggestions}
          requests={visiblePendingRewardRequests}
          isLoading={isLoadingRewards}
          errorMessage={rewardsError}
          onClose={() => setIsRewardsListVisible(false)}
          onSuggestionPress={setSelectedRewardSuggestion}
          onRequestPress={setSelectedRewardRequest}
          onRewardPress={setSelectedReward}
        />
        <EditRewardModal
          visible={Boolean(selectedReward)}
          reward={selectedReward}
          isSubmitting={isUpdatingReward}
          onClose={() => setSelectedReward(null)}
          onSubmit={handleUpdateReward}
        />
        <RewardSuggestionReviewModal
          visible={Boolean(selectedRewardSuggestion)}
          suggestion={selectedRewardSuggestion}
          isSubmitting={selectedRewardSuggestion ? reviewingSuggestionId === selectedRewardSuggestion.id : false}
          onClose={() => setSelectedRewardSuggestion(null)}
          onReview={handleReviewRewardSuggestion}
        />
        <RewardRequestReviewModal
          visible={Boolean(selectedRewardRequest)}
          request={selectedRewardRequest}
          reward={selectedRewardRequest ? visibleRewards.find((reward) => sameId(reward.id, selectedRewardRequest.rewardId)) : null}
          childName={selectedChild?.childName}
          isSubmitting={selectedRewardRequest ? reviewingRequestId === selectedRewardRequest.id : false}
          onClose={() => setSelectedRewardRequest(null)}
          onReview={handleReviewRewardRequest}
        />
        <NotificationsModal
          visible={isNotificationsVisible}
          notifications={notifications}
          onClose={() => setIsNotificationsVisible(false)}
          onNotificationPress={handleNotificationPress}
        />
        <ChildProfileEditModal
          visible={Boolean(selectedChildProfile)}
          child={selectedChildProfile}
          isSubmitting={isUpdatingChildProfile}
          onClose={() => setSelectedChildProfile(null)}
          onSubmit={handleUpdateChildProfile}
        />
      </View>
    </SafeAreaView>
  );
}

function ChildProfileEditModal({ visible, child, isSubmitting, onClose, onSubmit }) {
  const initialAvatar = useMemo(
    () => childAvatarOptions.find((avatar) => avatar.key === child?.childAvatarKey) ?? childAvatarOptions[0],
    [child?.childAvatarKey],
  );
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setSelectedAvatar(initialAvatar);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage('');
  }, [initialAvatar, visible]);

  const passwordsDoNotMatch = Boolean(newPassword && confirmPassword && newPassword !== confirmPassword);

  const handleSubmit = () => {
    setErrorMessage('');

    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword) {
        setErrorMessage('Unesite novu i ponovljenu šifru.');
        return;
      }

      if (newPassword.length < 8) {
        setErrorMessage('Nova šifra mora imati najmanje 8 karaktera.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage('Nova šifra i ponovljena šifra nisu iste.');
        return;
      }
    }

    onSubmit({
      child,
      avatarKey: selectedAvatar.key,
      newPassword: newPassword || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.childProfileModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Profil djeteta</Text>
            <Pressable onPress={onClose} disabled={isSubmitting} hitSlop={10}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.childProfileForm} showsVerticalScrollIndicator={false}>
            <View style={styles.childProfileHero}>
              <Image source={getChildAvatarSource(selectedAvatar.key)} style={styles.childProfileAvatar} />
              <Text style={styles.childProfileName}>{child?.childName || 'Dijete'}</Text>
            </View>

            <Text style={styles.childProfileSectionTitle}>Ikona djeteta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childAvatarEditRow}>
              {childAvatarOptions.map((avatar) => {
                const isSelected = selectedAvatar.key === avatar.key;

                return (
                  <Pressable
                    key={avatar.key}
                    style={[styles.childAvatarEditOption, isSelected && styles.childAvatarEditOptionSelected]}
                    onPress={() => setSelectedAvatar(avatar)}
                    disabled={isSubmitting}
                  >
                    <Image source={avatar.source} style={styles.childAvatarEditImage} resizeMode="cover" />
                    <Text style={[styles.childAvatarEditLabel, isSelected && styles.childAvatarEditLabelSelected]}>{avatar.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.childProfileSectionTitle}>Promjena šifre</Text>
            <PasswordEditInput
              value={newPassword}
              onChangeText={setNewPassword}
              isVisible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword((current) => !current)}
              placeholder="Nova šifra"
              editable={!isSubmitting}
            />
            <PasswordEditInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
              placeholder="Ponovi novu sifru"
              editable={!isSubmitting}
            />

            {passwordsDoNotMatch ? <Text style={styles.childProfileMismatch}>Nova šifra i ponovljena šifra nisu iste.</Text> : null}
            {errorMessage ? <Text style={styles.childProfileError}>{errorMessage}</Text> : null}
          </ScrollView>

          <View style={styles.modalActionsRow}>
            <Pressable style={[styles.rejectButton, isSubmitting && styles.disabledButton]} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.rejectButtonText}>Odustani</Text>
            </Pressable>
            <Pressable style={[styles.approveButton, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveButtonText}>Sačuvaj</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PasswordEditInput({ value, onChangeText, isVisible, onToggleVisibility, placeholder, editable }) {
  return (
    <View style={styles.childPasswordInputRow}>
      <TextInput
        style={styles.childPasswordInput}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isVisible}
        placeholder={placeholder}
        placeholderTextColor="#9aa6bd"
        editable={editable}
      />
      <Pressable style={styles.childPasswordToggle} onPress={onToggleVisibility} disabled={!editable}>
        <Text style={styles.childPasswordToggleText}>{isVisible ? 'Sakrij' : 'Prikaži'}</Text>
      </Pressable>
    </View>
  );
}

function Card({ title, icon, color, actionText = 'Pogledaj sve', onActionPress, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Icon source={icon} size={32} color={color} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Pressable style={styles.cardAction} onPress={onActionPress} disabled={!onActionPress}>
          <Text style={styles.cardActionText}>{actionText}</Text>
          <Icon source={icons.chevronRight} size={18} color="#0065ff" />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function ActionButton({ label, icon, color, green, onPress }) {
  return (
    <Pressable style={[styles.actionButton, green && styles.actionButtonGreen]} onPress={onPress}>
      <Icon source={icon} size={34} color={color} />
      <Text style={[styles.actionButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function StatusPill({ status }) {
  const statusInfo = getTaskStatusInfo(status);
  return (
    <View style={[styles.statusPill, { backgroundColor: statusInfo.backgroundColor }]}> 
      <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
      <Icon source={statusInfo.icon} size={22} color={statusInfo.color} />
    </View>
  );
}

function RewardSuggestionCard({ suggestion, onPress }) {
  return (
    <Pressable style={[styles.rewardCard, styles.rewardSuggestionCard, { backgroundColor: suggestion.color }]} onPress={onPress}>
      <View style={styles.newBadge}>
        <Text style={styles.newBadgeText}>New</Text>
      </View>
      <View style={styles.suggestionBang}>
        <Text style={styles.suggestionBangText}>!</Text>
      </View>
      <Image source={suggestion.image} style={styles.rewardImage} resizeMode="contain" />
      <Text style={styles.rewardTitle}>{suggestion.title}</Text>
      <Text style={styles.rewardSuggestionMeta}>Predloženo</Text>
    </Pressable>
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
        <View style={styles.rewardSuggestionModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Prijedlog nagrade</Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={isSubmitting}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.suggestionReviewRow}>
            <View style={[styles.rewardListImageBox, { backgroundColor: suggestion.color }]}>
              <Image source={suggestion.image} style={styles.rewardListImage} resizeMode="contain" />
            </View>
            <View style={styles.rewardListBody}>
              <Text style={styles.rewardListTitle}>{suggestion.title}</Text>
              <Text style={styles.rewardDueDate}>Dijete: {suggestion.childName}</Text>
              <Text style={styles.rewardDueDate}>Period: {formatDate(suggestion.dueDate)}</Text>
              <Text style={styles.rewardDueDate}>Poslano: {formatDate(suggestion.suggestedAt)}</Text>
            </View>
          </View>

          <Text style={styles.modalLabel}>Broj bodova za nagradu</Text>
          <TextInput
            style={styles.pointsInput}
            value={points}
            onChangeText={setPoints}
            placeholder="npr. 150"
            keyboardType="number-pad"
            editable={!isSubmitting}
          />

          <Text style={styles.modalLabel}>Vrijeme za ostvarenje</Text>
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
          <Text style={styles.reviewEditedDate}>Rok za nagradu: {formatDate(getApprovedDueDate())}</Text>

          <View style={styles.modalActionsRow}>
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

function RewardRequestReviewModal({ visible, request, reward, childName, isSubmitting, onClose, onReview }) {
  if (!request) {
    return null;
  }

  const rewardIcon = rewardIconSources[reward?.iconKey] ?? rewardIconSources.gamepad;
  const canDecide = isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.pending, 'Pending');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.rewardSuggestionModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Zahtjev nagrade</Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={isSubmitting}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.suggestionReviewRow}>
            <View style={[styles.rewardListImageBox, { backgroundColor: reward?.color || rewardIcon.color }]}>
              <Image source={reward?.image || rewardIcon.image} style={styles.rewardListImage} resizeMode="contain" />
            </View>
            <View style={styles.rewardListBody}>
              <Text style={styles.rewardListTitle}>{reward?.title || reward?.name || 'Nagrada'}</Text>
              <Text style={styles.rewardDueDate}>Dijete: {childName || 'Dijete'}</Text>
              <Text style={styles.rewardDueDate}>Potrebni bodovi: {getRewardPoints(reward)}</Text>
              <Text style={styles.rewardDueDate}>Poslano: {formatDate(request.requestDate)}</Text>
            </View>
          </View>

          {canDecide ? (
            <View style={styles.modalActionsRow}>
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

function EditRewardModal({ visible, reward, isSubmitting, onClose, onSubmit }) {
  const [rewardName, setRewardName] = useState('');
  const [points, setPoints] = useState('');
  const [selectedTime, setSelectedTime] = useState(rewardEditTimeOptions[0]);
  const [selectedIcon, setSelectedIcon] = useState(rewardIconOptions[0]);
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible && reward) {
      const iconKey = reward.iconKey ?? reward.rewardIcon;
      const icon = rewardIconOptions.find((option) => option.key === iconKey) ?? rewardIconOptions[0];

      setRewardName(reward.name ?? reward.title ?? '');
      setPoints(String(getRewardPoints(reward)));
      setSelectedTime(rewardEditTimeOptions[0]);
      setSelectedIcon(icon);
      setIsActive(reward.isActive !== false);
      setErrorMessage('');
    }
  }, [visible, reward?.id]);

  if (!reward) {
    return null;
  }

  const getEditedDueDate = () => {
    if (selectedTime.offsetDays === null) {
      return reward.dueDate;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + selectedTime.offsetDays);
    dueDate.setHours(12, 0, 0, 0);
    return dueDate.toISOString();
  };

  const handleSubmit = () => {
    const trimmedName = rewardName.trim();
    const parsedPoints = Number(points);

    if (!trimmedName) {
      setErrorMessage('Unesite naziv nagrade.');
      return;
    }

    if (trimmedName.length > 50) {
      setErrorMessage('Naziv nagrade može imati najviše 50 karaktera.');
      return;
    }

    if (!Number.isInteger(parsedPoints) || parsedPoints < 0 || parsedPoints > 5000) {
      setErrorMessage('Bodovi moraju biti cijeli broj od 0 do 5000.');
      return;
    }

    setErrorMessage('');
    onSubmit?.({
      name: trimmedName,
      description: reward.description ?? null,
      requiredPoints: parsedPoints,
      dueDate: getEditedDueDate(),
      rewardIcon: selectedIcon.key,
      isActive,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.rewardEditModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Uredi nagradu</Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={isSubmitting}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.rewardEditForm} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>Naziv nagrade</Text>
            <TextInput
              style={styles.pointsInput}
              value={rewardName}
              editable={!isSubmitting}
              onChangeText={(value) => {
                if (value.length <= 50) {
                  setRewardName(value);
                }
              }}
              placeholder="Unesite naziv nagrade"
              placeholderTextColor="#9aa6bd"
            />

            <Text style={styles.modalLabel}>Broj bodova</Text>
            <TextInput
              style={styles.pointsInput}
              value={points}
              editable={!isSubmitting}
              onChangeText={(value) => setPoints(value.replace(/[^0-9]/g, ''))}
              placeholder="npr. 150"
              placeholderTextColor="#9aa6bd"
              keyboardType="number-pad"
            />

            <Text style={styles.modalLabel}>Vrijeme za ostvarenje</Text>
            <View style={styles.reviewTimeRow}>
              {rewardEditTimeOptions.map((option) => {
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
            <Text style={styles.reviewEditedDate}>Rok za nagradu: {formatDate(getEditedDueDate())}</Text>

            <Text style={styles.modalLabel}>Ikonica nagrade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editRewardIconRow}>
              {rewardIconOptions.map((option) => {
                const isSelected = selectedIcon.key === option.key;

                return (
                  <Pressable
                    key={option.key}
                    style={[styles.editRewardIconOption, isSelected && styles.editRewardIconOptionSelected]}
                    onPress={() => setSelectedIcon(option)}
                    disabled={isSubmitting}
                  >
                    <View style={[styles.editRewardIconBox, { backgroundColor: option.color }]}>
                      <Image source={option.source} style={styles.editRewardIconImage} resizeMode="contain" />
                    </View>
                    <Text style={[styles.editRewardIconLabel, isSelected && styles.editRewardIconLabelSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.activeToggleRow} onPress={() => setIsActive((current) => !current)} disabled={isSubmitting}>
              <View style={[styles.activeToggleBox, isActive && styles.activeToggleBoxSelected]}>
                {isActive ? <Text style={styles.activeToggleCheck}>✓</Text> : null}
              </View>
              <View style={styles.activeToggleTextBox}>
                <Text style={styles.activeToggleTitle}>Nagrada je aktivna</Text>
                <Text style={styles.activeToggleHint}>Neaktivna nagrada se neće prikazivati djetetu.</Text>
              </View>
            </Pressable>
          </ScrollView>

          {errorMessage ? <Text style={styles.taskErrorText}>{errorMessage}</Text> : null}

          <View style={styles.modalActionsRow}>
            <Pressable style={[styles.rejectButton, isSubmitting && styles.disabledButton]} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.rejectButtonText}>Odustani</Text>
            </Pressable>
            <Pressable style={[styles.approveButton, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveButtonText}>Sačuvaj</Text>}
            </Pressable>
          </View>
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
            <View style={styles.taskStateBox}>
              <Text style={styles.emptyText}>Trenutno nema novih notifikacija.</Text>
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
                    <Text style={styles.notificationTime}>{formatTime(notification.date)}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function TasksListModal({ visible, tasks, isLoading, errorMessage, onClose, onTaskPress }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.tasksModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Svi zadaci</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.taskStateBox}>
              <ActivityIndicator color="#0065ff" />
              <Text style={styles.stateText}>Učitavanje zadataka...</Text>
            </View>
          ) : null}

          {errorMessage ? <Text style={styles.taskErrorText}>{errorMessage}</Text> : null}

          {!isLoading && !errorMessage && tasks.length === 0 ? (
            <View style={styles.taskStateBox}>
              <Text style={styles.emptyTitle}>Nema dodijeljenih zadataka.</Text>
              <Text style={styles.emptyText}>Dodajte zadatak da bi se ovdje prikazao.</Text>
            </View>
          ) : null}

          {tasks.length > 0 ? (
            <ScrollView style={styles.tasksModalList} showsVerticalScrollIndicator={false}>
              {tasks.map((task) => (
                <Pressable key={task.id} style={styles.modalTaskRow} onPress={() => onTaskPress?.(task)}>
                  <View style={[styles.taskImageBox, { backgroundColor: task.color }]}>
                    <Image source={task.image} style={styles.taskImage} resizeMode="contain" />
                  </View>
                  <View style={styles.taskBody}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={styles.taskPointsRow}>
                      <Icon source={icons.star} size={17} color="#ffc20e" />
                      <Text style={styles.taskPoints}>{getTaskPoints(task)} bodova</Text>
                    </View>
                  </View>
                  <StatusPill status={task.status} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function TaskDetailsModal({ task, isUpdating, onClose, onApprove, onReject }) {
  if (!task) {
    return null;
  }

  const canDecide = isTaskStatus(task.status, TASK_STATUSES.pendingApproval, 'PendingApproval');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.taskModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Detalji zadatka</Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={isUpdating}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.modalTaskRow}>
            <View style={[styles.taskImageBox, { backgroundColor: task.color }]}> 
              <Image source={task.image} style={styles.taskImage} resizeMode="contain" />
            </View>
            <View style={styles.taskBody}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={styles.taskPointsRow}>
                <Icon source={icons.star} size={17} color="#ffc20e" />
                <Text style={styles.taskPoints}>{getTaskPoints(task)} bodova</Text>
              </View>
            </View>
          </View>

          <View style={styles.modalStatusRow}>
            <Text style={styles.modalLabel}>Status</Text>
            <StatusPill status={task.status} />
          </View>

          <View style={styles.completionImageBlock}>
            <Text style={styles.modalLabel}>Slika izvršenja</Text>
            {task.completionImageDataUrl ? (
              <Image source={{ uri: task.completionImageDataUrl }} style={styles.completionImage} resizeMode="cover" />
            ) : (
              <View style={styles.noCompletionImageBox}>
                <Text style={styles.noCompletionImageText}>Dijete još nije poslalo sliku za ovaj zadatak.</Text>
              </View>
            )}
          </View>

          {canDecide ? (
            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.rejectButton, isUpdating && styles.disabledButton]} onPress={onReject} disabled={isUpdating}>
                <Text style={styles.rejectButtonText}>Otkaži</Text>
              </Pressable>
              <Pressable style={[styles.approveButton, isUpdating && styles.disabledButton]} onPress={onApprove} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveButtonText}>Odobri kao završeno</Text>}
              </Pressable>
            </View>
          ) : (
            <Text style={styles.modalHint}>Ovaj zadatak je već zaključen.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

function RewardsListModal({ visible, rewards, suggestions = [], requests = [], isLoading, errorMessage, onClose, onSuggestionPress, onRequestPress, onRewardPress }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.rewardsModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Sve nagrade</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.taskStateBox}>
              <ActivityIndicator color="#0ca85d" />
              <Text style={styles.stateText}>Učitavanje nagrada...</Text>
            </View>
          ) : null}

          {errorMessage ? <Text style={styles.taskErrorText}>{errorMessage}</Text> : null}

          {!isLoading && rewards.length === 0 && suggestions.length === 0 && requests.length === 0 ? (
            <View style={styles.taskStateBox}>
              <Text style={styles.emptyTitle}>Nema dodanih nagrada.</Text>
              <Text style={styles.emptyText}>Dodajte nagradu da bi se ovdje prikazala.</Text>
            </View>
          ) : null}

          {rewards.length > 0 || suggestions.length > 0 || requests.length > 0 ? (
            <ScrollView style={styles.rewardsModalList} showsVerticalScrollIndicator={false}>
              {requests.map((request) => {
                const reward = rewards.find((currentReward) => sameId(currentReward.id, request.rewardId));
                const rewardIcon = rewardIconSources[reward?.iconKey] ?? rewardIconSources.gamepad;

                return (
                  <Pressable key={`request-${request.id}`} style={[styles.rewardListRow, styles.rewardRequestListRow]} onPress={() => onRequestPress?.(request)}>
                    <View style={[styles.rewardListImageBox, { backgroundColor: reward?.color || rewardIcon.color }]}>
                      <Image source={reward?.image || rewardIcon.image} style={styles.rewardListImage} resizeMode="contain" />
                    </View>
                    <View style={styles.rewardListBody}>
                      <View style={styles.rewardSuggestionTitleRow}>
                        <Text style={styles.rewardListTitle}>{reward?.title || reward?.name || 'Nagrada'}</Text>
                        <View style={styles.requestBadgeInline}>
                          <Text style={styles.newBadgeText}>Zahtjev</Text>
                        </View>
                      </View>
                      <View style={styles.rewardPointsRow}>
                        <Icon source={icons.star} size={17} color="#ffc20e" />
                        <Text style={styles.rewardPoints}>{getRewardPoints(reward)} bodova</Text>
                      </View>
                      <Text style={styles.rewardDueDate}>Čeka odobrenje • {formatDate(request.requestDate)}</Text>
                    </View>
                    <View style={styles.suggestionBangSmall}>
                      <Text style={styles.suggestionBangText}>!</Text>
                    </View>
                  </Pressable>
                );
              })}
              {suggestions.map((suggestion) => (
                <Pressable key={`suggestion-${suggestion.id}`} style={[styles.rewardListRow, styles.rewardSuggestionListRow]} onPress={() => onSuggestionPress?.(suggestion)}>
                  <View style={[styles.rewardListImageBox, { backgroundColor: suggestion.color }]}>
                    <Image source={suggestion.image} style={styles.rewardListImage} resizeMode="contain" />
                  </View>
                  <View style={styles.rewardListBody}>
                    <View style={styles.rewardSuggestionTitleRow}>
                      <Text style={styles.rewardListTitle}>{suggestion.title}</Text>
                      <View style={styles.newBadgeInline}>
                        <Text style={styles.newBadgeText}>New</Text>
                      </View>
                    </View>
                    <Text style={styles.rewardDueDate}>Čeka odobrenje • {formatDate(suggestion.dueDate)}</Text>
                  </View>
                  <View style={styles.suggestionBangSmall}>
                    <Text style={styles.suggestionBangText}>!</Text>
                  </View>
                </Pressable>
              ))}
              {rewards.map((reward) => (
                <Pressable key={reward.id} style={styles.rewardListRow} onPress={() => onRewardPress?.(reward)}>
                  <View style={[styles.rewardListImageBox, { backgroundColor: reward.color }]}>
                    <Image source={reward.image} style={styles.rewardListImage} resizeMode="contain" />
                  </View>
                  <View style={styles.rewardListBody}>
                    <Text style={styles.rewardListTitle}>{reward.title}</Text>
                    <View style={styles.rewardPointsRow}>
                      <Icon source={icons.star} size={17} color="#ffc20e" />
                      <Text style={styles.rewardPoints}>{getRewardPoints(reward)} bodova</Text>
                    </View>
                    {reward.dueDate ? <Text style={styles.rewardDueDate}>{formatDate(reward.dueDate)}</Text> : null}
                  </View>
                  <View style={styles.editRewardPill}>
                    <Icon source={icons.pencil} size={15} color="#0ca85d" />
                    <Text style={styles.editRewardText}>Uredi</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function BottomNavigation({ bottomInset, onNavigateHome, onNavigateChildren, onNavigateRewards, onNavigateMessages, onNavigateProfile }) {
  const items = [
    { label: 'Početna', icon: icons.home, active: true, onPress: onNavigateHome },
    { label: 'Djeca', icon: icons.user, onPress: onNavigateChildren },
    { label: 'Nagrade', icon: icons.gift, onPress: onNavigateRewards },
    { label: 'Poruke', icon: require('../../assets/home-icons/chat.png'), onPress: onNavigateMessages },
    { label: 'Profil', icon: icons.profile, onPress: onNavigateProfile },
  ];

  return (
    <View style={[styles.bottomNav, { bottom: Math.max(bottomInset, 8), paddingBottom: 12 + Math.max(bottomInset - 8, 0) }]}>
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
  if (source === icons.clipboard) {
    return <ClipboardIcon size={size} color={color} />;
  }

  return <Image source={source} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />;
}

function ClipboardIcon({ size, color }) {
  const lineHeight = Math.max(2, size * 0.09);
  const borderWidth = Math.max(1.5, size * 0.08);

  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.18,
          width: size * 0.68,
          height: size * 0.7,
          borderWidth,
          borderColor: color,
          borderRadius: size * 0.12,
          paddingTop: size * 0.23,
          alignItems: 'center',
          gap: size * 0.1,
        }}
      >
        <View style={{ width: size * 0.37, height: lineHeight, borderRadius: lineHeight, backgroundColor: color }} />
        <View style={{ width: size * 0.37, height: lineHeight, borderRadius: lineHeight, backgroundColor: color }} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: size * 0.04,
          width: size * 0.38,
          height: size * 0.25,
          borderWidth,
          borderColor: color,
          borderRadius: size * 0.12,
          backgroundColor: '#ffffff',
        }}
      />
    </View>
  );
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

function getTaskPoints(task) {
  return Number(task?.points) || 0;
}

function getRewardPoints(reward) {
  return Number(reward?.requiredPoints ?? reward?.points) || 0;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('bs-BA');
}

function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' });
}

function getTaskStatusInfo(status) {
  if (isTaskStatus(status, TASK_STATUSES.approved, 'Approved')) {
    return { label: 'Završeno', color: '#0a9d57', backgroundColor: '#e8f8ef', icon: icons.checkCircle };
  }

  if (isTaskStatus(status, TASK_STATUSES.rejected, 'Rejected')) {
    return { label: 'Otkazano', color: '#d33b3b', backgroundColor: '#fff0f0', icon: icons.bell };
  }

  if (isTaskStatus(status, TASK_STATUSES.pendingApproval, 'PendingApproval')) {
    return { label: 'Čeka odobrenje', color: '#c77a00', backgroundColor: '#fff4dc', icon: icons.bell };
  }

  return { label: 'Dodijeljeno', color: '#0065ff', backgroundColor: '#e8f2ff', icon: icons.bell };
}

function getTaskStatusLabel(status) {
  return getTaskStatusInfo(status).label;
}

function getAvailablePointsForChild(tasks, rewardRequests, childId, rewards) {
  if (!childId) {
    return 0;
  }

  const earnedPoints = tasks
    .filter((task) => sameId(task.childId, childId) && isTaskStatus(task.status, TASK_STATUSES.approved, 'Approved'))
    .reduce((total, task) => total + getTaskPoints(task), 0);

  const spentPoints = rewardRequests
    .filter((request) => sameId(request.childId, childId) && isRewardRequestStatus(request.status, REWARD_REQUEST_STATUSES.approved, 'Approved'))
    .reduce((total, request) => {
      const reward = rewards.find((currentReward) => sameId(currentReward.id, request.rewardId));
      return total + getRewardPoints(reward);
    }, 0);

  return Math.max(earnedPoints - spentPoints, 0);
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#edf5ff' },
  screen: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 108 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  backIcon: { width: 26, height: 26, tintColor: '#0065ff', transform: [{ rotate: '180deg' }] },
  headerTitle: { color: '#0065ff', fontSize: 21, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: 0, top: 0, minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#ff3d32', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  badgeText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  parentAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#dfe5ff' },
  sectionEyebrow: { color: '#4c5877', fontSize: 17, fontWeight: '600', marginBottom: 12 },
  stateBox: { borderWidth: 1, borderColor: '#dce6f5', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16 },
  stateText: { color: '#4c5877', fontSize: 14, marginTop: 8, textAlign: 'center' },
  errorText: { color: '#a32929', fontSize: 14, textAlign: 'center' },
  emptyCard: { borderWidth: 1, borderColor: '#dce6f5', borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 20, backgroundColor: '#ffffff' },
  emptyTitle: { color: '#071e60', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyText: { color: '#4c5877', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  emptyButton: { marginTop: 16, height: 48, borderRadius: 12, backgroundColor: '#0065ff', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  childrenSelector: { gap: 12, paddingBottom: 20 },
  childSelectCard: { width: 210, minHeight: 94, borderRadius: 15, borderWidth: 1, borderColor: '#e0e8f4', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 },
  childSelectCardActive: { borderColor: '#0065ff', borderWidth: 1.6 },
  selectorAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e7f3ff' },
  selectorTextBox: { flex: 1, marginLeft: 12 },
  selectorName: { color: '#071e60', fontSize: 21, fontWeight: '800' },
  selectorPoints: { color: '#4c5877', fontSize: 15, fontWeight: '600', marginTop: 4 },
  selectCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#d0d7e5', alignItems: 'center', justifyContent: 'center' },
  selectCircleActive: { backgroundColor: '#0065ff', borderColor: '#0065ff' },
  heroPanel: { borderRadius: 22, backgroundColor: '#eefdff', padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroAvatarBox: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#dff4ff', alignItems: 'center', justifyContent: 'center' },
  heroAvatar: { width: 84, height: 84, borderRadius: 42 },
  heroInfo: { flex: 1, minWidth: 92 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroName: { color: '#071e60', fontSize: 24, fontWeight: '800' },
  editButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e8f1ff', alignItems: 'center', justifyContent: 'center' },
  pointsLabel: { color: '#4c5877', fontSize: 15, marginTop: 12 },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'nowrap' },
  pointsValue: { color: '#0a49cc', fontSize: 34, fontWeight: '900', lineHeight: 40, minWidth: 62 },
  heroActions: { width: 142, gap: 10, alignItems: 'stretch', justifyContent: 'center' },
  actionButton: { minHeight: 74, borderRadius: 14, borderWidth: 1, borderColor: '#7fb1ff', backgroundColor: '#eef6ff', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8 },
  actionButtonGreen: { borderColor: '#8ddcae', backgroundColor: '#effced' },
  actionButtonText: { fontSize: 13, fontWeight: '900', textAlign: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 18, padding: 14, marginBottom: 16, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { color: '#071e60', fontSize: 21, fontWeight: '800' },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardActionText: { color: '#0065ff', fontSize: 14, fontWeight: '700' },
  taskList: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, overflow: 'hidden' },
  taskRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e8eef7' },
  taskImageBox: { width: 58, height: 58, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  taskImage: { width: 45, height: 45 },
  taskBody: { flex: 1, marginLeft: 14 },
  taskTitle: { color: '#071e60', fontSize: 16, fontWeight: '800' },
  taskPointsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  taskPoints: { color: '#4c5877', fontSize: 13, fontWeight: '600' },
  statusPill: { minWidth: 112, height: 40, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  statusFinished: { backgroundColor: '#e8f8ef' },
  statusProgress: { backgroundColor: '#e8f2ff' },
  statusText: { fontSize: 13, fontWeight: '800' },
  statusFinishedText: { color: '#0a9d57' },
  statusProgressText: { color: '#0065ff' },
  rewardsRow: { gap: 12, paddingBottom: 12 },
  rewardCard: { width: 132, borderRadius: 14, padding: 10, alignItems: 'center' },
  rewardSuggestionCard: { borderWidth: 1.5, borderColor: '#ff354d' },
  rewardImage: { width: 88, height: 78 },
  rewardTitle: { color: '#071e60', fontSize: 14, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  rewardSuggestionMeta: { color: '#ff354d', fontSize: 12, fontWeight: '900', marginTop: 5 },
  newBadge: { position: 'absolute', top: 7, left: 7, borderRadius: 999, backgroundColor: '#ff354d', paddingHorizontal: 8, paddingVertical: 3, zIndex: 2 },
  newBadgeInline: { borderRadius: 999, backgroundColor: '#ff354d', paddingHorizontal: 8, paddingVertical: 3 },
  requestBadgeInline: { borderRadius: 999, backgroundColor: '#0065ff', paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  suggestionBang: { position: 'absolute', top: 7, right: 7, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff3d9', borderWidth: 1, borderColor: '#ff354d', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  suggestionBangSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff3d9', borderWidth: 1, borderColor: '#ff354d', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  suggestionBangText: { color: '#ff354d', fontSize: 17, fontWeight: '900' },
  rewardPointsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  rewardPoints: { color: '#4c5877', fontSize: 12, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0065ff' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#cbd4e3' },
  taskStateBox: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 16, alignItems: 'center' },
  taskErrorText: { color: '#a32929', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.42)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  taskModalCard: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  rewardSuggestionModalCard: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  rewardEditModalCard: { width: '100%', maxWidth: 390, maxHeight: '88%', borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  rewardEditForm: { maxHeight: 520, marginBottom: 14 },
  childProfileModalCard: { width: '100%', maxWidth: 390, maxHeight: '88%', borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  childProfileForm: { maxHeight: 520, marginBottom: 14 },
  childProfileHero: { alignItems: 'center', marginBottom: 16 },
  childProfileAvatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#dfe5ff', marginBottom: 10 },
  childProfileName: { color: '#071e60', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  childProfileSectionTitle: { color: '#071e60', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  childAvatarEditRow: { gap: 10, paddingBottom: 16, paddingRight: 2 },
  childAvatarEditOption: { width: 78, minHeight: 94, borderRadius: 14, borderWidth: 1, borderColor: '#dce3ef', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, backgroundColor: '#ffffff' },
  childAvatarEditOptionSelected: { borderColor: '#0065ff', backgroundColor: '#eef5ff' },
  childAvatarEditImage: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#dfe5ff' },
  childAvatarEditLabel: { color: '#536079', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  childAvatarEditLabelSelected: { color: '#0065ff' },
  childPasswordInputRow: { minHeight: 52, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 13, backgroundColor: '#fbfdff', marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  childPasswordInput: { flex: 1, minHeight: 52, paddingHorizontal: 15, color: '#071e60', fontSize: 16, fontWeight: '600' },
  childPasswordToggle: { minHeight: 52, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  childPasswordToggleText: { color: '#0065ff', fontSize: 13, fontWeight: '900' },
  childProfileMismatch: { color: '#d92d20', fontSize: 13, fontWeight: '800', marginTop: -4, marginBottom: 8 },
  childProfileError: { color: '#d92d20', fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  notificationsModalCard: { width: '100%', maxWidth: 390, maxHeight: '78%', borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { color: '#071e60', fontSize: 24, fontWeight: '800' },
  modalClose: { color: '#536079', fontSize: 34, lineHeight: 34, fontWeight: '300' },
  modalTaskRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 12, marginBottom: 14 },
  modalStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalLabel: { color: '#4c5877', fontSize: 15, fontWeight: '700' },
  reviewTimeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 },
  reviewTimeOption: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: '#dce3ef', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  reviewTimeOptionSelected: { borderColor: '#10a96b', backgroundColor: '#effced' },
  reviewTimeText: { color: '#52607b', fontSize: 13, fontWeight: '800' },
  reviewTimeTextSelected: { color: '#0c8c51' },
  reviewEditedDate: { color: '#64708b', fontSize: 13, fontWeight: '700', marginBottom: 14 },
  completionImageBlock: { marginBottom: 18 },
  completionImage: { width: '100%', height: 180, borderRadius: 14, backgroundColor: '#edf1f7', marginTop: 10 },
  noCompletionImageBox: { minHeight: 92, borderWidth: 1, borderColor: '#dce3ef', borderStyle: 'dashed', borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 10 },
  noCompletionImageText: { color: '#536079', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  modalActionsRow: { flexDirection: 'row', gap: 12 },
  rejectButton: { flex: 1, height: 50, borderRadius: 11, borderWidth: 1.4, borderColor: '#d33b3b', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  rejectButtonText: { color: '#d33b3b', fontSize: 15, fontWeight: '800' },
  approveButton: { flex: 1.25, height: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a9d57' },
  approveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  disabledButton: { opacity: 0.65 },
  modalHint: { color: '#4c5877', fontSize: 14, textAlign: 'center' },
  suggestionReviewRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 12, marginBottom: 16, backgroundColor: '#fbfdff' },
  pointsInput: { minHeight: 52, borderWidth: 1, borderColor: '#dce3ef', borderRadius: 13, paddingHorizontal: 14, color: '#071e60', fontSize: 17, fontWeight: '800', backgroundColor: '#fbfdff', marginTop: 8, marginBottom: 16 },
  tasksModalCard: { width: '100%', maxWidth: 390, maxHeight: '78%', borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  tasksModalList: { maxHeight: 430 },
  rewardsModalCard: { width: '100%', maxWidth: 390, maxHeight: '78%', borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  rewardsModalList: { maxHeight: 430 },
  rewardListRow: { minHeight: 86, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: '#ffffff' },
  rewardSuggestionListRow: { borderColor: '#ffb4bd', backgroundColor: '#fff8f9' },
  rewardRequestListRow: { borderColor: '#b9d4ff', backgroundColor: '#f7fbff' },
  rewardListImageBox: { width: 58, height: 58, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rewardListImage: { width: 45, height: 45 },
  rewardListBody: { flex: 1, marginLeft: 14 },
  rewardListTitle: { color: '#071e60', fontSize: 16, fontWeight: '800' },
  editRewardPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: '#effced', paddingHorizontal: 9, paddingVertical: 6, marginLeft: 8 },
  editRewardText: { color: '#0ca85d', fontSize: 12, fontWeight: '900' },
  editRewardIconRow: { gap: 10, paddingTop: 8, paddingBottom: 14 },
  editRewardIconOption: { width: 76, minHeight: 84, borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: '#ffffff' },
  editRewardIconOptionSelected: { borderColor: '#0ca85d', backgroundColor: '#effced' },
  editRewardIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editRewardIconImage: { width: 36, height: 36 },
  editRewardIconLabel: { color: '#536079', fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  editRewardIconLabelSelected: { color: '#0ca85d' },
  activeToggleRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#dce3ef', borderRadius: 13, padding: 12, backgroundColor: '#fbfdff', marginBottom: 4 },
  activeToggleBox: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: '#c8d2e3', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  activeToggleBoxSelected: { borderColor: '#0ca85d', backgroundColor: '#0ca85d' },
  activeToggleCheck: { color: '#ffffff', fontSize: 17, fontWeight: '900', lineHeight: 20 },
  activeToggleTextBox: { flex: 1, marginLeft: 10 },
  activeToggleTitle: { color: '#071e60', fontSize: 14, fontWeight: '900' },
  activeToggleHint: { color: '#6a748c', fontSize: 12, fontWeight: '600', marginTop: 3 },
  rewardSuggestionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rewardDueDate: { color: '#6a748c', fontSize: 12, fontWeight: '600', marginTop: 6 },
  notificationsList: { maxHeight: 430 },
  notificationRow: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 13, padding: 12, marginBottom: 10, flexDirection: 'row', backgroundColor: '#fbfdff' },
  notificationTypePill: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#eaf2ff', paddingHorizontal: 9, paddingVertical: 5, marginRight: 10 },
  notificationTypeText: { color: '#0065ff', fontSize: 11, fontWeight: '900' },
  notificationBody: { flex: 1 },
  notificationTitle: { color: '#071e60', fontSize: 15, fontWeight: '900' },
  notificationText: { color: '#4c5877', fontSize: 13, lineHeight: 18, marginTop: 4 },
  notificationTime: { color: '#8790a7', fontSize: 12, marginTop: 6 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 12, minHeight: 82, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#e6edf7', backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 8 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
  navLabel: { color: '#46536c', fontSize: 12, marginTop: 4, fontWeight: '600' },
  navLabelActive: { color: '#0065ff' },
});


