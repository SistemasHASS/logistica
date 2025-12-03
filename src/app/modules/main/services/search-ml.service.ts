import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';


@Injectable({
  providedIn: 'root',
})
export class SearchMLService {
//   private model: use.UniversalSentenceEncoder | null = null;
  private model: any = null;    

  private itemsOriginal: any[] = [];
  private embeddingsMatrix: any = null;  // evitar tf.Tensor2D estricto
//   private embeddingsMatrix: tf.Tensor2D | null = null;

  constructor() {}

  // -----------------------------------------------------
  //  Cargar modelo USE (solo una vez)
  // -----------------------------------------------------
  async loadModel() {
    if (this.model) return;
    console.log('⏳ Cargando modelo USE...');
    this.model = await use.load();
    console.log('✅ Modelo USE cargado');
  }

  // -----------------------------------------------------
  // Inicializa y crea embeddings de todos los items
  // -----------------------------------------------------
  async init(items: any[]) {
    this.itemsOriginal = items;

    if (!this.model) await this.loadModel();

    const textos = items.map((x) =>
      `${x.descripcionLocal ?? ''} ${x.descripcionCompleta ?? ''}`.trim()
    );

    console.log('⏳ Generando embeddings...');
    if (!this.model) {
      console.warn('Modelo no cargado aún');
      return;
    }
    this.embeddingsMatrix = await (this.model.embed(textos)) as any;


    console.log('✅ Embeddings generados:', this.embeddingsMatrix);
  }

  // -----------------------------------------------------
  // Búsqueda usando similitud coseno
  // -----------------------------------------------------
  async buscar(query: string, maxResultados: number = 20) {
    if (!this.model || !this.embeddingsMatrix) {
      console.warn('⚠️ Modelo no inicializado. Llamando init()...');
      return [];
    }

    const consultaEmbedding = await (this.model.embed([query])) as any;


    const sim = this.cosineSimilarityBatch(
      consultaEmbedding,
      this.embeddingsMatrix
    );

    const simArray = await sim.array();
    const scores = simArray[0];

    let resultados = this.itemsOriginal
      .map((item, index) => ({
        item,
        _score: scores[index],
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, maxResultados);

    return resultados;
  }

  // -----------------------------------------------------
  // Similaridad coseno batch (rápido)
  // -----------------------------------------------------
  cosineSimilarityBatch(a: tf.Tensor2D, b: tf.Tensor2D): tf.Tensor2D {
    const dotProduct = tf.matMul(a, b, false, true);

    const normA = tf.norm(a, 2, 1);
    const normB = tf.norm(b, 2, 1);

    const normMul = tf.mul(normA.expandDims(1), normB.expandDims(0));

    return tf.div(dotProduct, normMul);
  }
}