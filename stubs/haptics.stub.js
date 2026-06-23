// Stub for expo-haptics on web
const ImpactFeedbackStyle = { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' };
const NotificationFeedbackType = { Success: 'Success', Warning: 'Warning', Error: 'Error' };

const impactAsync = async () => {};
const notificationAsync = async () => {};
const selectionAsync = async () => {};

module.exports = { impactAsync, notificationAsync, selectionAsync, ImpactFeedbackStyle, NotificationFeedbackType };
module.exports.default = { impactAsync, notificationAsync, selectionAsync, ImpactFeedbackStyle, NotificationFeedbackType };
