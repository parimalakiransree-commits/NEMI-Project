
/**
 * Simple Logistic Regression implementation for client-side ML
 */
export class LogisticRegression {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number = 0.1;
  private iterations: number = 1000;

  constructor(learningRate = 0.1, iterations = 1000) {
    this.learningRate = learningRate;
    this.iterations = iterations;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  public fit(X: number[][], y: number[]): void {
    const numSamples = X.length;
    const numFeatures = X[0].length;
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    for (let i = 0; i < this.iterations; i++) {
      let dw = new Array(numFeatures).fill(0);
      let db = 0;

      for (let j = 0; j < numSamples; j++) {
        const linearModel = X[j].reduce((acc, val, idx) => acc + val * this.weights[idx], 0) + this.bias;
        const yPred = this.sigmoid(linearModel);

        const diff = yPred - y[j];
        for (let k = 0; k < numFeatures; k++) {
          dw[k] += diff * X[j][k];
        }
        db += diff;
      }

      for (let k = 0; k < numFeatures; k++) {
        this.weights[k] -= (this.learningRate * dw[k]) / numSamples;
      }
      this.bias -= (this.learningRate * db) / numSamples;
    }
  }

  public predictProba(x: number[]): number {
    const linearModel = x.reduce((acc, val, idx) => acc + val * this.weights[idx], 0) + this.bias;
    return this.sigmoid(linearModel);
  }

  public predict(x: number[]): number {
    return this.predictProba(x) >= 0.5 ? 1 : 0;
  }
}

export function preprocessPatient(p: any) {
  return [
    p.age / 45, // Normalize age
    p.deliveryType === 'Cesarean' ? 1 : 0,
    p.laborDuration / 24,
    p.complications ? 1 : 0,
    p.los / 10,
    p.location === 'Rural' ? 1 : 0
  ];
}
