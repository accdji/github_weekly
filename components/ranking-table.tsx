type RankingItem = {
  rank: number;
  score: number;
  starDelta7d: number;
  repository: {
    fullName: string;
    description: string | null;
    htmlUrl: string;
    language: string | null;
    stars: number;
  };
};

type RankingDictionary = {
  empty: string;
  columns: {
    rank: string;
    repository: string;
    weeklyStars: string;
    totalStars: string;
    score: string;
  };
};

export function RankingTable({ items, dictionary }: { items: RankingItem[]; dictionary: RankingDictionary }) {
  if (!items.length) {
    return <div className="panel empty">{dictionary.empty}</div>;
  }

  return (
    <div className="panel">
      <table className="table">
        <thead>
          <tr>
            <th>{dictionary.columns.rank}</th>
            <th>{dictionary.columns.repository}</th>
            <th>{dictionary.columns.weeklyStars}</th>
            <th>{dictionary.columns.totalStars}</th>
            <th>{dictionary.columns.score}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.repository.fullName}>
              <td className="metric">#{item.rank}</td>
              <td>
                <a className="repo-name" href={item.repository.htmlUrl} target="_blank" rel="noreferrer">
                  {item.repository.fullName}
                </a>
                {item.repository.description ? <div className="repo-desc">{item.repository.description}</div> : null}
                <div className="chips">
                  {item.repository.language ? <span className="chip">{item.repository.language}</span> : null}
                </div>
              </td>
              <td className="metric">+{item.starDelta7d}</td>
              <td className="metric">{item.repository.stars}</td>
              <td className="metric">{item.score.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
