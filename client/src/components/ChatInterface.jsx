// Create a new component for chat interface
const ChatInterface = ({ 
  chatHistory, 
  chatMessage, 
  setChatMessage, 
  handleChat, 
  isChatting,
  processFormattedText 
}) => {
  return (
    <div className="mt-6 space-y-4">
      <div className="chat-messages-container">
        {chatHistory.map((msg, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-600/20 ml-8' : 'bg-gray-700/50 mr-8'
            }`}
            dangerouslySetInnerHTML={{ 
              __html: processFormattedText(msg.content)
            }}
          />
        ))}
        <div id="scroll-anchor" />
      </div>
      
      <form onSubmit={handleChat} className="flex gap-2">
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder="Ask me anything about the video..."
          className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isChatting}
        />
        <button
          type="submit"
          disabled={isChatting || !chatMessage.trim()}
          className="px-6 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ask'}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface; 