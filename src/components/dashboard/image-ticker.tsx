const IMAGES = [
  "https://i.ibb.co/JjbfrMFG/1.jpg",
  "https://i.ibb.co/xQkxqvv/2.jpg",
  "https://i.ibb.co/nqn6gHV6/3.webp",
  "https://i.ibb.co/vxBmvRjr/4.webp",
  "https://i.ibb.co/Kpk92GXm/5.jpg",
  "https://i.ibb.co/tTdtnwsS/6.jpg",
  "https://i.ibb.co/WWK8c94m/7.jpg",
  "https://i.ibb.co/nN4qfJrw/8.jpg",
  "https://i.ibb.co/gMxVs5Zc/9.jpg",
  "https://i.ibb.co/rGxvj2dB/10.jpg",
  "https://i.ibb.co/cczQRy7P/11.webp",
  "https://i.ibb.co/3m36xkm6/12.png",
  "https://i.ibb.co/YCTYsWV/13.jpg",
  "https://i.ibb.co/zWPnTVPQ/14.jpg",
  "https://i.ibb.co/2YysTcg8/15.jpg",
  "https://i.ibb.co/KMykS3b/16.jpg",
  "https://i.ibb.co/67z575S1/17.jpg",
  "https://i.ibb.co/XZ18gFQk/18.jpg",
  "https://i.ibb.co/67kDzsTR/19.jpg",
  "https://i.ibb.co/gbg5pG6t/20.jpg",
  "https://i.ibb.co/Myy25Zy4/21.jpg",
  "https://i.ibb.co/GQJJqx0x/22.jpg",
  "https://i.ibb.co/3519DJ7s/23.jpg",
  "https://i.ibb.co/gbnMkSN8/24.jpg",
  "https://i.ibb.co/5XS7CjZN/25.jpg",
];

const ROW_ONE = IMAGES.slice(0, 13);
const ROW_TWO = IMAGES.slice(13);

function Row({ items, duration, height }: { items: string[]; duration: number; height: string }) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div
        className="flex w-max gap-3 animate-ticker"
        style={{ animationDuration: `${duration}s` }}
      >
        {loop.map((src, i) => (
          <div
            key={i}
            className={`${height} shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card`}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-auto max-w-none object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImageTicker() {
  return (
    <section className="-mx-5 space-y-3 overflow-hidden sm:-mx-8">
      <Row items={ROW_ONE} duration={70} height="h-[150px] sm:h-[180px]" />
      <Row items={ROW_TWO} duration={90} height="h-[150px] sm:h-[180px]" />
    </section>
  );
}
