import { useState } from 'react';

import { AddChildScreen } from './src/screens/AddChildScreen';
import { ChildHomeScreen } from './src/screens/ChildHomeScreen';
import { ChildrenScreen } from './src/screens/ChildrenScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ParentHomeScreen } from './src/screens/ParentHomeScreen';
import { ParentProfileScreen } from './src/screens/ParentProfileScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { USER_ROLES } from './src/config/api';

const routes = {
  addChild: 'addChild',
  childHome: 'childHome',
  children: 'children',
  login: 'login',
  parentHome: 'parentHome',
  parentProfile: 'parentProfile',
  register: 'register',
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(routes.register);
  const [authSession, setAuthSession] = useState(null);
  const [addChildReturnRoute, setAddChildReturnRoute] = useState(routes.parentHome);
  const [selectedChildIdForChildren, setSelectedChildIdForChildren] = useState(null);
  const [openRewardsOnChildren, setOpenRewardsOnChildren] = useState(false);
  const [openMessagesOnParentHome, setOpenMessagesOnParentHome] = useState(false);

  const navigateToChildren = (childId = null, options = {}) => {
    setSelectedChildIdForChildren(childId);
    setOpenRewardsOnChildren(Boolean(options.openRewards));
    setCurrentRoute(routes.children);
  };
  const navigateToLogin = () => setCurrentRoute(routes.login);
  const navigateToParentHome = () => setCurrentRoute(routes.parentHome);
  const navigateToParentProfile = () => setCurrentRoute(routes.parentProfile);
  const navigateToRegister = () => setCurrentRoute(routes.register);

  const navigateToHome = () => {
    if (authSession?.user?.role === USER_ROLES.child || authSession?.user?.role === 'Child') {
      setCurrentRoute(routes.childHome);
      return;
    }

    setCurrentRoute(routes.parentHome);
  };

  const navigateToAddChild = (returnRoute = routes.parentHome) => {
    setAddChildReturnRoute(returnRoute);
    setCurrentRoute(routes.addChild);
  };

  const navigateToRewards = () => {
    navigateToChildren(null, { openRewards: true });
  };

  const navigateToMessages = () => {
    setOpenMessagesOnParentHome(true);
    setCurrentRoute(routes.parentHome);
  };

  const handleLoginSuccess = (loginResponse) => {
    setAuthSession(loginResponse);
    setCurrentRoute(
      loginResponse?.user?.role === USER_ROLES.child || loginResponse?.user?.role === 'Child'
        ? routes.childHome
        : routes.parentHome,
    );
  };

  const handleProfileUpdated = (updatedUser) => {
    setAuthSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      return {
        ...currentSession,
        user: {
          ...currentSession.user,
          ...updatedUser,
        },
      };
    });
  };

  if (currentRoute === routes.addChild) {
    const onBack = addChildReturnRoute === routes.children ? navigateToChildren : navigateToParentHome;
    return <AddChildScreen token={authSession?.token} onBack={onBack} />;
  }

  if (currentRoute === routes.children) {
    return (
      <ChildrenScreen
        token={authSession?.token}
        user={authSession?.user}
        onBack={navigateToParentHome}
        initialSelectedChildId={selectedChildIdForChildren}
        onNavigateToAddChild={() => navigateToAddChild(routes.children)}
        onNavigateHome={navigateToHome}
        openRewardsOnStart={openRewardsOnChildren}
        onRewardsOpened={() => setOpenRewardsOnChildren(false)}
        onNavigateToProfile={navigateToParentProfile}
        onNavigateToMessages={navigateToMessages}
      />
    );
  }

  if (currentRoute === routes.childHome) {
    return <ChildHomeScreen token={authSession?.token} user={authSession?.user} onNavigateHome={navigateToHome} />;
  }

  if (currentRoute === routes.parentHome) {
    return (
      <ParentHomeScreen
        token={authSession?.token}
        user={authSession?.user}
        onNavigateToAddChild={() => navigateToAddChild(routes.parentHome)}
        onNavigateToChildren={navigateToChildren}
        onNavigateHome={navigateToHome}
        onNavigateToRewards={navigateToRewards}
        onNavigateToProfile={navigateToParentProfile}
        openMessagesOnStart={openMessagesOnParentHome}
        onMessagesOpened={() => setOpenMessagesOnParentHome(false)}
      />
    );
  }

  if (currentRoute === routes.parentProfile) {
    return (
      <ParentProfileScreen
        token={authSession?.token}
        user={authSession?.user}
        onProfileUpdated={handleProfileUpdated}
        onNavigateHome={navigateToHome}
        onNavigateToChildren={navigateToChildren}
        onNavigateToRewards={navigateToRewards}
        onNavigateToMessages={navigateToMessages}
      />
    );
  }

  if (currentRoute === routes.login) {
    return <LoginScreen onNavigateToRegister={navigateToRegister} onLoginSuccess={handleLoginSuccess} />;
  }

  return <RegisterScreen onNavigateToLogin={navigateToLogin} />;
}

