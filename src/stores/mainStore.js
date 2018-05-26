import { action, autorun, computed, observable } from 'mobx';

export class MainStore {
  get availableRocketNames() {
    return ["ALL ROCKETS", "FALCON 1", "FALCON 9", "FALCON 10", "FALCON HEAVY"];
  };

  @observable activeViewName = 'list';
  
  @observable launchState = {
    launch: null,
    launchPad: null,
    rocket: null,
    isLoading: false,
    error: null,
  };

  @observable listState = {
    rocketNameFilter: "FALCON 1",
    allLaunches: {},
    isLoading: false,
    error: null,
  }

  constructor() {
    this.disposeAutorun = autorun(() => {
      if (this.activeViewName === 'list') {
        const rocketNameFilter = this.listState.rocketNameFilter;
        this.listState.isLoading = false;
        this.listState.error = null;
        if (!this.listState.allLaunches.hasOwnProperty(rocketNameFilter)) {
          this.listState.isLoading = true;
          this.fetchLaunchByRocketName(rocketNameFilter).then(newLaunches => {
            this.listState.allLaunches[rocketNameFilter] = newLaunches;
            this.listState.isLoading = false;
          }).catch(error => {
            this.listState.error = error;
            this.listState.isLoading = false;
          });
        }
      }
      if (this.activeViewName === 'details') {
        let { launch } = this.launchState;
        let launchPadURL = `https://api.spacexdata.com/v2/launchpads/${launch.launch_site.site_id}`;
        let rocketURL = `https://api.spacexdata.com/v2/rockets/${launch.rocket.rocket_id}`;
        Promise.all([
          this.getResponseFromUrl(launchPadURL),
          this.getResponseFromUrl(rocketURL)  
        ]).then(data => {
          this.launchState.launchPad = data[0];
          this.launchState.rocket = data[1];
          this.launchState.isLoading = false;
        }).catch(error => {
          this.launchState.isLoading = false;
          this.launchState.error = error;
        });
        window.scrollTo(0, 0);
      }
    });
  }

  @action.bound
  handleLaunchClick(launch) {
    this.launchState.launch = 0launch;
    this.launchState.isLoading = true;
    this.launchState.error = null;
    this.activeViewName = 'details';
  }

  @action.bound
  handleBackClick() {
    this.activeViewName = 'list';
  }

  @action.bound
  setFilter(event) {
    this.listState.rocketNameFilter = event.currentTarget.text;
  }

  async fetchLaunchByRocketName(rocketNameFilter) {
    rocketNameFilter = (rocketNameFilter === "ALL ROCKETS") ? '' : rocketNameFilter;
    const rocketId = rocketNameFilter.split(" ").join("").toLowerCase();
    const URL = `https://api.spacexdata.com/v2/launches?rocket_id=${rocketId}`;
    let jsonResponse = await this.getResponseFromUrl(URL);
    jsonResponse = (!jsonResponse) ? [] : jsonResponse;
    return jsonResponse;
  }

  async getResponseFromUrl(URL) {
    let response = await fetch(URL);
    return await response.json();
  };

}

const instance = new MainStore();

export default instance;
