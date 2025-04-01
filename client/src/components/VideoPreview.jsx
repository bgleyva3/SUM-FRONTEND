// Create a new component for video preview
const VideoPreview = ({ videoInfo }) => {
  return (
    <div className="flex justify-center items-center mt-2 mb-8">
      <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 max-w-md">
        <div className="flex flex-col gap-3">
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-[160px] h-[120px] rounded-lg shadow-lg mx-auto object-cover"
            style={{ objectFit: 'cover' }}
          />
          <div className="overflow-hidden text-center">
            <h3 className="text-lg font-semibold mb-1 line-clamp-2">{videoInfo.title}</h3>
            <p className="text-gray-400 text-sm truncate">Channel: {videoInfo.channelTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview; 