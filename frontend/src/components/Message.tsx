type MessageProps = {
  type: "error" | "success" | "info";
  children: React.ReactNode;
};

export default function Message({ type, children }: MessageProps) {
  return <div className={`message message-${type}`}>{children}</div>;
}
