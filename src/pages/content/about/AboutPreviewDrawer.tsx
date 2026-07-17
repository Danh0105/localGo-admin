import { Drawer, Empty, Skeleton, Tag } from 'antd';
import type { JSX } from 'react';
import type { AboutPreview } from '../../../types/about';

interface AboutPreviewDrawerProps {
  open: boolean;
  loading: boolean;
  data: AboutPreview | null;
  onClose: () => void;
}

export function AboutPreviewDrawer({ open, loading, data, onClose }: AboutPreviewDrawerProps): JSX.Element {
  return (
    <Drawer title="Xem trước — Giới thiệu (mobile)" open={open} onClose={onClose} size={420} destroyOnHidden>
      {loading && <Skeleton active paragraph={{ rows: 8 }} />}
      {!loading && !data && <Empty description="Chưa có dữ liệu xem trước" />}
      {!loading && data && (
        <div className="about-preview-mobile">
          <div className="about-preview-hero">
            {data.hero.imageUrl ? (
              <img src={data.hero.imageUrl} alt={data.hero.imageAlt} />
            ) : (
              <div className="about-preview-hero__placeholder">Chưa có ảnh hero</div>
            )}
            <h1>{data.title}</h1>
          </div>

          <section className="about-preview-section">
            <h2>{data.overview.title}</h2>
            {data.overview.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>

          {data.statistics.length > 0 && (
            <section className="about-preview-stats">
              {data.statistics.map((stat) => (
                <div key={stat.id} className="about-preview-stats__item">
                  <strong>
                    {stat.value}
                    {stat.unit}
                  </strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </section>
          )}

          {data.highlights.length > 0 && (
            <section className="about-preview-section">
              <h2>{data.highlightsSectionTitle}</h2>
              {data.highlights.map((highlight) => (
                <div key={highlight.id} className="about-preview-highlight">
                  {highlight.imageUrl && <img src={highlight.imageUrl} alt={highlight.imageAlt} />}
                  <div>
                    <strong>{highlight.title}</strong>
                    <p>{highlight.description}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {data.milestones.length > 0 && (
            <section className="about-preview-section">
              <h2>{data.milestonesSectionTitle}</h2>
              <ol className="about-preview-timeline">
                {data.milestones.map((milestone) => (
                  <li key={milestone.id}>
                    <Tag color="blue">{milestone.year}</Tag>
                    {milestone.title && <strong>{milestone.title}</strong>}
                    <p>{milestone.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}
