import { supabase } from '../supabaseClient';

export type Notification = {
  id: string;
  user_id: string;
  message: string;
  notification_type: 'stats_update' | 'system';
  created_at: string;
  is_read: boolean;
};

export const notificationService = {
  async getNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data as Notification[];
  },

  async addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'user_id'>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('No user found');
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          ...notification,
          user_id: userData.user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding notification:', error);
      throw error;
    }

    return data as Notification;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('No user found');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  async subscribeToNotifications(callback: (notification: Notification) => void) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('No user found');
    }

    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userData.user.id}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
}; 