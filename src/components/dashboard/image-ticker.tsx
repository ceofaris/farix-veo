const IMAGES = [
  "https://i.ibb.co/bj1byZhn/1.jpg",
  "https://i.ibb.co/zWzcRqGR/2.jpg",
  "https://i.ibb.co/qM3f5GHC/3.webp",
  "https://i.ibb.co/QFrhvr0m/4.webp",
  "https://i.ibb.co/svnTNZLK/5.jpg",
  "https://i.ibb.co/k2hrrSBw/6.jpg",
  "https://i.ibb.co/TBn6Q0gd/7.jpg",
  "https://i.ibb.co/W4cjCzSz/8.jpg",
  "https://i.ibb.co/mrW4JZXF/9.jpg",
  "https://i.ibb.co/Wp2CDjcM/10.jpg",
  "https://i.ibb.co/3mXQTYsf/11.webp",
  "https://i.ibb.co/spP3zqQ5/12.png",
  "https://i.ibb.co/67hnxrQH/13.jpg",
  "https://i.ibb.co/9S3j9SY/14.jpg",
  "https://i.ibb.co/cccspTJV/15.jpg",
  "https://i.ibb.co/Kjs64L4D/16.jpg",
  "https://i.ibb.co/jkqky1yc/17.jpg",
  "https://i.ibb.co/mFq7fFWT/18.jpg",
  "https://i.ibb.co/sJFkXxwk/19.jpg",
  "https://i.ibb.co/cSM2ZBcN/20.jpg",
  "https://i.ibb.co/DB4kmJM/21.jpg",
  "https://i.ibb.co/SXJJmsgb/22.jpg",
  "https://i.ibb.co/MyGbN3t2/23.jpg",
  "https://i.ibb.co/Y7zZPsxk/24.jpg",
  "https://i.ibb.co/VW5ckczL/25.jpg",
];


const ROW_ONE = IMAGES.slice(0, 13);
const ROW_TWO = IMAGES.slice(13);

function Row({ items, duration, height }: { items: string[]; duration: number; height: string }) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div
        className="flex w-max gap-1.5 animate-ticker"
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
