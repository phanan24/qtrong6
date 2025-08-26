import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXRendererProps {
  content: string;
}

export function LaTeXRenderer({ content }: LaTeXRendererProps) {
  // Parse content and render LaTeX expressions
  const renderContent = (text: string) => {
    // Split content by LaTeX delimiters
    const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Block math (display mode)
        const latex = part.slice(2, -2);
        try {
          return <BlockMath key={index} math={latex} />;
        } catch (error) {
          console.error('LaTeX render error:', error);
          return <span key={index} className="text-red-500">[LaTeX Error: {latex}]</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        // Inline math
        const latex = part.slice(1, -1);
        try {
          return <InlineMath key={index} math={latex} />;
        } catch (error) {
          console.error('LaTeX render error:', error);
          return <span key={index} className="text-red-500">[LaTeX Error: {latex}]</span>;
        }
      } else {
        // Regular text - preserve line breaks and formatting
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      }
    });
  };

  return <div className="latex-content">{renderContent(content)}</div>;
}