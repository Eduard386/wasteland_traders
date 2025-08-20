// Mulberry32 RNG для воспроизводимых случайностей
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // Mulberry32 алгоритм
  next(): number {
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Генерация целого числа в диапазоне [min, max)
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // Выбор случайного элемента из массива
  choice<T>(array: T[]): T {
    return array[this.int(0, array.length)];
  }

  // Генерация булевого значения с вероятностью
  bool(probability: number): boolean {
    return this.next() < probability;
  }
}

// Создание RNG для конкретного контекста
export function createRNG(seed: number, tick: number, scopeKey: string): SeededRNG {
  // Комбинируем seed, tick и scopeKey для уникального контекста
  const combinedSeed = seed + tick * 1000 + scopeKey.charCodeAt(0);
  return new SeededRNG(combinedSeed);
}
