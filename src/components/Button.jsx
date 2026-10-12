const VARIANT_CLASSES = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
};

export default function Button({ as: Component = 'button', variant = 'primary', className = '', type = 'button', ...props }) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  return (
    <Component
      {...(Component === 'button' ? { type } : {})}
      className={`btn ${variantClass} ${className}`.trim()}
      {...props}
    />
  );
}
