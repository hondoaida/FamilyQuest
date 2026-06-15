import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AddTaskModal } from '../components/AddTaskModal';
import { getMyChildren } from '../services/childrenService';
import { createTask, getTasks, TASK_STATUSES, updateTaskStatus } from '../services/taskService';
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
  star: require('../../assets/home-icons/star.png'),
};

const childAvatars = [
  require('../../assets/boy-one.png'),
  require('../../assets/boy-two.png'),
  require('../../assets/girl-one.png'),
  require('../../assets/girl-two.png'),
];

const taskIconSources = {
  dishes: { image: require('../../assets/taskt-item/dishes.png'), color: '#dff4ff' },
  bed: { image: require('../../assets/taskt-item/bed.png'), color: '#efe5ff' },
  laundry: { image: require('../../assets/taskt-item/laundry.png'), color: '#e9f9e6' },
  trash: { image: require('../../assets/taskt-item/trash.png'), color: '#e5f4ff' },
  toys: { image: require('../../assets/taskt-item/toys.png'), color: '#fff1c8' },
  notebook: { image: require('../../assets/taskt-item/notebook.png'), color: '#ffe5d3' },
  vacum: { image: require('../../assets/taskt-item/vacum.png'), color: '#f0ecff' },
  gardening: { image: require('../../assets/taskt-item/gardening.png'), color: '#e7f8d9' },
};

const suggestedRewards = [
  { id: 1, title: 'Igra po izboru', points: 300, image: require('../../assets/reward-items/gamepad.png'), color: '#eee4ff' },
  { id: 2, title: 'Vožnja bicikla', points: 250, image: require('../../assets/reward-items/travel-car.png'), color: '#e7f8d9' },
  { id: 3, title: 'Večernji film', points: 200, image: require('../../assets/rewards.png'), color: '#fff0ba' },
  { id: 4, title: 'Sladoled', points: 150, image: require('../../assets/reward-items/ice-cream.png'), color: '#ffdce8' },
];

export function ChildrenScreen({ token, user, initialSelectedChildId, onBack, onNavigateToAddChild }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAddTaskVisible, setIsAddTaskVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

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
  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? children[0],
    [children, selectedChildId],
  );

  const selectedIndex = Math.max(0, children.findIndex((child) => child.id === selectedChild?.id));

  const visibleAssignedTasks = useMemo(() => {
    if (!selectedChild) {
      return [];
    }

    return tasks
      .filter((task) => task.childId === selectedChild.childId)
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
    () => visibleAssignedTasks
      .filter((task) => isTaskStatus(task.status, TASK_STATUSES.approved, 'Approved'))
      .reduce((total, task) => total + task.points, 0),
    [visibleAssignedTasks],
  );

  const handleCreateTask = async (taskPayload) => {
    if (!token) {
      throw new Error('Morate biti prijavljeni da biste dodali zadatak.');
    }

    const createdTask = await createTask({ token, task: taskPayload });
    setTasks((currentTasks) => [createdTask, ...currentTasks]);
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
              <Pressable style={styles.bellButton}>
                <Icon source={icons.bell} size={31} color="#44506a" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
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
                      <Image source={childAvatars[index % childAvatars.length]} style={styles.selectorAvatar} />
                      <View style={styles.selectorTextBox}>
                        <Text style={styles.selectorName}>{child.childName}</Text>
                        <Text style={styles.selectorPoints}>{getApprovedPointsForChild(tasks, child.childId)} bodova</Text>
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
                  <Image source={childAvatars[selectedIndex % childAvatars.length]} style={styles.heroAvatar} />
                </View>
                <View style={styles.heroInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.heroName}>{selectedChild.childName}</Text>
                    <Pressable style={styles.editButton} hitSlop={10}>
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
                  <ActionButton label="Dodaj nagradu" icon={icons.gift} color="#0ca85d" green />
                </View>
              </View>

              <Card title="Dodijeljeni zadaci" icon={icons.clipboard} color="#0065ff">
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
                            <Text style={styles.taskPoints}>{task.points} bodova</Text>
                          </View>
                        </View>
                        <StatusPill status={task.status} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </Card>

              <Card title="Predložene nagrade" icon={icons.gift} color="#ff354d">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsRow}>
                  {suggestedRewards.map((reward) => (
                    <View key={reward.id} style={[styles.rewardCard, { backgroundColor: reward.color }]}>
                      <Image source={reward.image} style={styles.rewardImage} resizeMode="contain" />
                      <Text style={styles.rewardTitle}>{reward.title}</Text>
                      <View style={styles.rewardPointsRow}>
                        <Icon source={icons.star} size={17} color="#ffc20e" />
                        <Text style={styles.rewardPoints}>{reward.points} bodova</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.dotsRow}>
                  <View style={styles.dotActive} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </Card>
            </>
          ) : null}
        </ScrollView>

        <BottomNavigation />
        <TaskDetailsModal
          task={selectedTask}
          isUpdating={isUpdatingTask}
          onClose={() => setSelectedTask(null)}
          onApprove={() => handleUpdateTaskStatus(TASK_STATUSES.approved)}
          onReject={() => handleUpdateTaskStatus(TASK_STATUSES.rejected)}
        />
        <AddTaskModal
          visible={isAddTaskVisible}
          child={selectedChild}
          onClose={() => setIsAddTaskVisible(false)}
          onSubmit={handleCreateTask}
        />
      </View>
    </SafeAreaView>
  );
}

function Card({ title, icon, color, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Icon source={icon} size={32} color={color} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Pressable style={styles.cardAction}>
          <Text style={styles.cardActionText}>Pogledaj sve</Text>
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
      <Icon source={icon} size={30} color={color} />
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

function TaskDetailsModal({ task, isUpdating, onClose, onApprove, onReject }) {
  if (!task) {
    return null;
  }

  const canDecide = !isTaskStatus(task.status, TASK_STATUSES.approved, 'Approved') && !isTaskStatus(task.status, TASK_STATUSES.rejected, 'Rejected');

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
                <Text style={styles.taskPoints}>{task.points} bodova</Text>
              </View>
            </View>
          </View>

          <View style={styles.modalStatusRow}>
            <Text style={styles.modalLabel}>Status</Text>
            <StatusPill status={task.status} />
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
function BottomNavigation() {
  const items = [
    { label: 'Početna', icon: icons.home, active: true },
    { label: 'Zadaci', icon: icons.clipboard },
    { label: 'Nagrade', icon: icons.gift },
    { label: 'Poruke', icon: require('../../assets/home-icons/chat.png') },
    { label: 'Profil', icon: icons.profile },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => (
        <Pressable key={item.label} style={styles.navItem}>
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
  return status === numericValue || status === textValue;
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

function getApprovedPointsForChild(tasks, childId) {
  return tasks
    .filter((task) => task.childId === childId && isTaskStatus(task.status, TASK_STATUSES.approved, 'Approved'))
    .reduce((total, task) => total + task.points, 0);
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
  heroActions: { width: 126, gap: 10 },
  actionButton: { minHeight: 56, borderRadius: 12, borderWidth: 1, borderColor: '#7fb1ff', backgroundColor: '#eef6ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8 },
  actionButtonGreen: { borderColor: '#8ddcae', backgroundColor: '#effced' },
  actionButtonText: { fontSize: 14, fontWeight: '800' },
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
  rewardImage: { width: 88, height: 78 },
  rewardTitle: { color: '#071e60', fontSize: 14, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  rewardPointsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  rewardPoints: { color: '#4c5877', fontSize: 12, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0065ff' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#cbd4e3' },
  taskStateBox: { borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 16, alignItems: 'center' },
  taskErrorText: { color: '#a32929', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.42)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  taskModalCard: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: '#ffffff', padding: 20, shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { color: '#071e60', fontSize: 24, fontWeight: '800' },
  modalClose: { color: '#536079', fontSize: 34, lineHeight: 34, fontWeight: '300' },
  modalTaskRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e8f4', borderRadius: 14, padding: 12, marginBottom: 14 },
  modalStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalLabel: { color: '#4c5877', fontSize: 15, fontWeight: '700' },
  modalActionsRow: { flexDirection: 'row', gap: 12 },
  rejectButton: { flex: 1, height: 50, borderRadius: 11, borderWidth: 1.4, borderColor: '#d33b3b', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  rejectButtonText: { color: '#d33b3b', fontSize: 15, fontWeight: '800' },
  approveButton: { flex: 1.25, height: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a9d57' },
  approveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  modalHint: { color: '#4c5877', fontSize: 14, textAlign: 'center' },  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 82, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#e6edf7', backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', shadowColor: '#0f2b5f', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 8 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
  navLabel: { color: '#46536c', fontSize: 12, marginTop: 4, fontWeight: '600' },
  navLabelActive: { color: '#0065ff' },
});




















