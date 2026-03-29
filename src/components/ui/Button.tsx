type ButtonVariant = 'primary' | 'success' | 'danger' | 'secondary';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = ''
}: Props) => {
  const base = "px-4 py-2 rounded-lg text-white font-medium transition";

  const variants = {
    primary: "bg-moe-600 hover:bg-moe-700",
    success: "bg-green-600 hover:bg-green-700",
    danger: "bg-red-600 hover:bg-red-700",
    secondary: "bg-gray-500 hover:bg-gray-600"
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};