jQuery Transform Animate
=============

Rework $.animate, for best performance in Android 4.4<.
Work in progress build.

- basic proper work
```
    left: 50,
    left: '50px'
    left: '+=10px;'
    left: '-=10'
```

```
    $('.anim').animate({
        left: 500, 
        top: 100, 
        rotate: 90,
        opacity: 0.5, 
        width: 50, 
    });
```

- time management :
```
$('.anim').pause();     // pause
$('.anim').play();      // play
$('.anim').stop();      // stop and set top/left
```

- simply chain :
```
$('.anim').animate({ left: 10 }).animate({ top: 50 });
```

- extend function
```
$('.anim').rotate(90);
```

Features unstable or remove
=============

- currently it does not replace the real animate or jQuery enhanced
- scale property not worked
- rotate cause multiple problem