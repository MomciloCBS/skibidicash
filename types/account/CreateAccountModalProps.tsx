// 🆕 Create Account Modal
export interface CreateAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onCreateAccount: (name: string, emoji: string) => void;
  }