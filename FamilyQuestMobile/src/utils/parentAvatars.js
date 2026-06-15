export const parentAvatarOptions = [
  { key: 'mum-one', label: 'Mama 1', source: require('../../assets/parent-item/mum-one.png') },
  { key: 'mum-two', label: 'Mama 2', source: require('../../assets/parent-item/mum-two.png') },
  { key: 'mum-three', label: 'Mama 3', source: require('../../assets/parent-item/mum-three.png') },
  { key: 'dad-one', label: 'Tata 1', source: require('../../assets/parent-item/dad-one.png') },
  { key: 'dad-two', label: 'Tata 2', source: require('../../assets/parent-item/dad-two.png') },
  { key: 'dad-three', label: 'Tata 3', source: require('../../assets/parent-item/dad-three.png') },
];

export function getParentAvatarSource(avatarKey) {
  return parentAvatarOptions.find((avatar) => avatar.key === avatarKey)?.source ?? parentAvatarOptions[0].source;
}
