type LoadingStateProps = {
  label?: string;
};

export default function LoadingState({ label = "Загрузка..." }: LoadingStateProps) {
  return (
    <div className="loading-state">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
