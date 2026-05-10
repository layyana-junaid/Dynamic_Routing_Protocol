import { useCallback } from 'react';
import useSimulationStore from '../store/simulationStore';
import * as api from '../api/client';

/**
 * Exposes high-level simulation actions that call the API
 * and update the store accordingly.
 */
export default function useSimulation() {
  const store = useSimulationStore();

  const loadTopologyList = useCallback(async () => {
    const list = await api.listTopologies();
    store.setTopologyList(list);
  }, []);

  const loadTopology = useCallback(async (id) => {
    const res = await api.loadTopology(id);
    store.setTopology(res.topology);
    store.resetState();
  }, []);

  const changeProtocol = useCallback(async (name) => {
    await api.setProtocol(name);
    store.setProtocol(name);
    store.resetState();
    store.setBottomTab('log');
  }, []);

  const changeSpeed = useCallback(async (speed) => {
    await api.setSpeed(speed);
    store.setSpeed(speed);
  }, []);

  const start = useCallback(async () => {
    await api.startSim();
  }, []);

  const pause = useCallback(async () => {
    await api.pauseSim();
  }, []);

  const stop = useCallback(async () => {
    await api.stopSim();
  }, []);

  const step = useCallback(async () => {
    await api.stepSim();
  }, []);

  const reset = useCallback(async () => {
    await api.resetSim();
    store.resetState();
  }, []);

  const failLink = useCallback(async (linkId) => {
    await api.failLink(linkId);
  }, []);

  const recoverLink = useCallback(async (linkId) => {
    await api.recoverLink(linkId);
  }, []);

  const fetchRoutingTable = useCallback(async (routerId) => {
    const res = await api.getRoutingTable(routerId);
    useSimulationStore.setState((s) => ({
      routingTables: { ...s.routingTables, [routerId]: res.entries },
    }));
  }, []);

  const runComparison = useCallback(async (failLinkId) => {
    const res = await api.runComparison(failLinkId);
    store.setComparisonResults(res.results);
    store.setBottomTab('comparison');
  }, []);

  return {
    loadTopologyList,
    loadTopology,
    changeProtocol,
    changeSpeed,
    start,
    pause,
    stop,
    step,
    reset,
    failLink,
    recoverLink,
    fetchRoutingTable,
    runComparison,
  };
}
