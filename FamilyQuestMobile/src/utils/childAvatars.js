export const childAvatarOptions = [
  { key: 'boy-one', label: 'Dječak 1', source: require('../../assets/child-item/boy-one.png') },
  { key: 'boy-two', label: 'Dječak 2', source: require('../../assets/child-item/boy-two.png') },
  { key: 'boy-three', label: 'Dječak 3', source: require('../../assets/child-item/boy-three.png') },
  { key: 'boy-four', label: 'Dječak 4', source: require('../../assets/child-item/boy-four.png') },
  { key: 'girl-one', label: 'Djevojčica 1', source: require('../../assets/child-item/girl-one.png') },
  { key: 'girl-two', label: 'Djevojčica 2', source: require('../../assets/child-item/girl-two.png') },
  { key: 'girl-three', label: 'Djevojčica 3', source: require('../../assets/child-item/girl-three.png') },
  { key: 'girl-four', label: 'Djevojčica 4', source: require('../../assets/child-item/girl-four.png') },
];

export function getChildAvatarSource(avatarKey, fallbackIndex = 0) {
  return childAvatarOptions.find((avatar) => avatar.key === avatarKey)?.source
    ?? childAvatarOptions[fallbackIndex % childAvatarOptions.length].source;
}
