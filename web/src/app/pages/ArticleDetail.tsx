import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, Clock, User } from 'lucide-react';
import { articles, type ArticleBlock } from '../data/articles';

function Block({ block }: { block: ArticleBlock }) {
  if (block.type === 'image') {
    return (
      <div style={{ margin: '20px -20px' }}>
        <img
          src={block.src}
          alt={block.caption}
          style={{ width: '100%', display: 'block', maxHeight: 340, objectFit: 'cover' }}
        />
        {block.caption && (
          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '6px 20px 0', fontStyle: 'italic' }}>
            {block.caption}
          </p>
        )}
      </div>
    );
  }

  if (block.type === 'heading') {
    return (
      <h2 style={{
        fontSize: block.level === 2 ? 20 : 17,
        fontWeight: 800,
        color: '#1a1a1a',
        margin: '24px 0 10px',
        lineHeight: 1.3,
      }}>
        {block.text}
      </h2>
    );
  }

  return (
    <p style={{
      fontSize: 16,
      lineHeight: 1.75,
      color: '#2a2a2a',
      margin: '0 0 16px',
    }}>
      {block.text}
    </p>
  );
}

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const article = articles.find((a) => a.id === Number(id));

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#f8f4f2' }}>
        <p style={{ color: '#888' }}>Статья не найдена</p>
        <button onClick={() => navigate('/journal')} style={{ color: '#722F37', marginTop: 12 }}>
          Вернуться в журнал
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="relative" style={{ height: 300 }}>
        <img
          src={article.image}
          alt={article.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(10,5,5,0.8) 100%)' }}
        />

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="absolute flex items-center justify-center rounded-full"
          style={{ top: 16, left: 16, width: 36, height: 36, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}
        >
          <ChevronLeft size={20} color="#fff" />
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span
            className="rounded-full px-2 py-0.5 mb-3 inline-block"
            style={{ background: '#722F37', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}
          >
            {article.category}
          </span>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, lineHeight: 1.3, margin: 0 }}>
            {article.title}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <User size={12} color="rgba(255,255,255,0.6)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{article.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} color="rgba(255,255,255,0.6)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{article.readTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '20px 20px 0', background: '#f8f4f2' }}>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
          {article.description}
        </p>
      </div>

      {/* Article body */}
      <div style={{ padding: '20px 20px 120px', background: '#fff' }}>
        {article.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        {/* Source link */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 8 }}>
          <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', margin: 0 }}>
            Источник:{' '}
            <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: '#722F37' }}>
              Snob.ru
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
