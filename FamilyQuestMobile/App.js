import { useState } from 'react';

import { AddChildScreen } from './src/screens/AddChildScreen';
import { ChildrenScreen } from './src/screens/ChildrenScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ParentHomeScreen } from './src/screens/ParentHomeScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';

const routes = {
  addChild: 'addChild',
  children: 'children',
  login: 'login',
  parentHome: 'parentHome',
  register: 'register',
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(routes.register);
  const [authSession, setAuthSession] = useState(null);
  const [addChildReturnRoute, setAddChildReturnRoute] = useState(routes.parentHome);
  const [selectedChildIdForChildren, setSelectedChildIdForChildren] = useState(null);

  const navigateToChildren = (childId = null) => {
    setSelectedChildIdForChildren(childId);
    setCurrentRoute(routes.children);
  };
  const navigateToLogin = () => setCurrentRoute(routes.login);
  const navigateToParentHome = () => setCurrentRoute(routes.parentHome);
  const navigateToRegister = () => setCurrentRoute(routes.register);

  const navigateToAddChild = (returnRoute = routes.parentHome) => {
    setAddChildReturnRoute(returnRoute);
    setCurrentRoute(routes.addChild);
  };

  const handleLoginSuccess = (loginResponse) => {
    setAuthSession(loginResponse);
    setCurrentRoute(routes.parentHome);
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
      />
    );
  }

  if (currentRoute === routes.parentHome) {
    return (
      <ParentHomeScreen
        token={authSession?.token}
        user={authSession?.user}
        onNavigateToAddChild={() => navigateToAddChild(routes.parentHome)}
        onNavigateToChildren={navigateToChildren}
      />
    );
  }

  if (currentRoute === routes.login) {
    return <LoginScreen onNavigateToRegister={navigateToRegister} onLoginSuccess={handleLoginSuccess} />;
  }

  return <RegisterScreen onNavigateToLogin={navigateToLogin} />;
}

