const ChatList = ({ items , myId}) => {
  return (
    <div className="chat-box">
      {items.map((msg, index) => {
        // On vérifie si l'id de l'envoyeur est le mien
        const isMe = msg.senderId === myId;

        return (
          <div
            key={index}
            className={`message-wrapper ${isMe ? 'me' : 'opponent'}`}
          >
            <div className="message-bubble">
              {/* Optionnel : afficher un petit nom ou juste le texte */}
              <p>{msg.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  )
}

export default ChatList;
