import { useNavigate } from 'react-router';
import { articles } from '../data/articles';

export default function Journal() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: '#f8f4f2', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ background: '#722F37' }}>
        <div className="flex items-center justify-center px-4 pt-4 pb-4">
          <div style={{ letterSpacing: 4 }}>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, fontFamily: 'Georgia, serif' }}>В</span>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 400, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>И</span>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, fontFamily: 'Georgia, serif' }}>Н</span>
            <span style={{ color: '#E8C97A', fontSize: 22, fontWeight: 900, fontFamily: 'Georgia, serif' }}>А</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-3">
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Про вино
        </h2>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {articles.map((article) => (
          <div
            key={article.id}
            className="rounded-2xl overflow-hidden cursor-pointer relative"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            onClick={() => navigate(`/article/${article.id}`)}
          >
            <img
              src={article.image}
              alt={article.title}
              className="w-full object-cover"
              style={{ height: 200 }}
            />
            <div
              className="absolute inset-0 flex flex-col justify-end p-4"
              style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(20,10,10,0.78) 100%)' }}
            >
              <span
                className="rounded-full px-2 py-0.5 mb-2 self-start"
                style={{ background: '#722F37', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}
              >
                {article.category}
              </span>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
                {article.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
                {article.readTime} · {article.author}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
