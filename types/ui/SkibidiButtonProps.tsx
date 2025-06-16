// 🚽 Enhanced Button Component
export interface SkibidiButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'chaos' | 'sigma' | 'small';
    style?: any;
    icon?: string;
    disabled?: boolean;
}

  