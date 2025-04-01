import ReactMarkdown from 'react-markdown';

const SummaryContent = ({ content, usedLanguage }) => {
  const getTitle = (language) => {
    const titles = {
      'en': 'Summary',
      'es': 'Resumen',
      'fr': 'Résumé',
      'pt': 'Resumo',
      'de': 'Zusammenfassung',
      'it': 'Riassunto',
      'zh': '摘要',
      'ja': '要約',
      'ko': '요약',
      'ru': 'Сводка'
    };
    const baseLanguage = language.split('-')[0];
    return titles[baseLanguage] || titles['en'];
  };

  const processFormattedText = (text) => {
    return text
      .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/&amp;#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
  };

  if (!content) return null;
  
  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-2xl font-bold mb-6 text-white">
        {getTitle(usedLanguage)}
      </h2>
      <div 
        className="text-gray-300 leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ 
          __html: processFormattedText(content)
        }}
      />
    </div>
  );
};

export default SummaryContent; 