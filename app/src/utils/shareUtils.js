import { Share, Platform } from 'react-native';

export const shareContent = async (content) => {
  try {
    const result = await Share.share({
      message: Platform.OS === 'ios' ? null : content.message,
      url: Platform.OS === 'ios' ? content.url : null,
      title: content.title
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
        return { success: true, platform: result.activityType };
      } else {
        // shared
        return { success: true };
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
      return { success: false, dismissed: true };
    }
  } catch (error) {
    return { success: false, error };
  }
}; 