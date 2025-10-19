// src/navigation/types.ts

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  Main: undefined;
  Chat: { chatId: string; chatName?: string; isGroup?: boolean };
  CreateGroup: undefined;
  GroupSettings: { groupId: string };
  EditGroup: { groupId: string };
  UserSearch: undefined;
  ChangePassword: undefined;
  EditProfile: undefined;
  UserDetails: { userId: string };
  GroupDetails: { groupId: string; groupName?: string; groupAvatar?: string };
  Home: undefined;
  Profile: undefined;
  Chats: undefined;
};
