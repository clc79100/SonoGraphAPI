import { Module } from '@nestjs/common';
import { AudiodbService } from './audiodb.service';
import { LastfmService } from './lastfm.service';
import { MusicbrainzService } from './musicbrainz.service';
import { SpotifyService } from './spotify.service';

@Module({
  providers: [MusicbrainzService, SpotifyService, LastfmService, AudiodbService],
  exports: [MusicbrainzService, SpotifyService, LastfmService, AudiodbService],
})
export class ProxyModule {}
