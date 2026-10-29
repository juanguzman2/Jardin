import { dayBalance } from './balance';

describe('dayBalance', () => {
  it('cuenta me acerca, me aleja y neutral; ignora sin etiqueta', () => {
    expect(
      dayBalance([
        { direction: 'toward' },
        { direction: 'toward' },
        { direction: 'away' },
        { direction: 'neutral' },
        { direction: null },
      ]),
    ).toEqual({ toward: 2, away: 1, neutral: 1 });
  });

  it('día vacío', () => {
    expect(dayBalance([])).toEqual({ toward: 0, away: 0, neutral: 0 });
  });
});
