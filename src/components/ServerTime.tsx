export default function ServerTime() {
  return (
    <div className="text-xs text-gray-500 p-2">
      Server time: {new Date().toISOString()}
    </div>
  );
}
